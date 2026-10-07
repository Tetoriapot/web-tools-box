import { toolSlugs } from './quality-helpers';
import { expect, test } from './fixtures';
import { assertUsable, runConversion } from './quality-helpers';

for (const width of [360, 768])
  for (const theme of ['light', 'dark'] as const) {
    test(`${width}px ${theme}: alternate modes and error states stay usable`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      for (const slug of await toolSlugs(page)) {
        await page.goto(`/tools/${slug}`);
        await expect(page.locator('.workspace')).toBeVisible();
        const specialMode: Record<string, string> = {
          'url-encoder': 'クエリ解析',
          'base64-converter': '画像',
          'favicon-maker': '画像',
          'image-format-converter': 'JPEG',
          'image-resizer': '割合（%）',
        };
        const mode = specialMode[slug];
        const radios = page.locator('.controls-panel').getByRole('radio');
        if (mode) await page.getByRole('radio', { name: mode, exact: true }).check();
        else if (await radios.count()) await radios.last().check();
        await page.getByRole('button', { name: 'サンプル', exact: true }).click();
        if (mode) await page.getByRole('radio', { name: mode, exact: true }).check();
        else if (await radios.count()) await radios.last().check();
        if (slug === 'border-radius-maker') await page.getByRole('checkbox').uncheck();
        if (slug === 'json-visualizer') {
          await page
            .getByRole('textbox', { name: 'JSON', exact: true })
            .fill(JSON.stringify({ ['長いキー'.repeat(50)]: { a: [1, 2] } }));
        }
        await runConversion(page);
        if (
          page.url().includes('image-') ||
          ['screenshot-decorator', 'favicon-maker', 'code-shot', 'qr-code-maker'].includes(slug)
        )
          await expect(
            page.getByRole('img', { name: '出力画像のプレビュー', exact: true }),
          ).toBeVisible();
        await expect(page.getByRole('alert')).toHaveCount(0);
        await assertUsable(page, `${slug} alternate`);

        const file = page.locator('input[type=file]').first();
        const number = page.locator('.controls-panel input[type=number]').first();
        const color = page.locator('.controls-panel .color-control input[type=text]').first();
        const text = page.locator('.controls-panel textarea:not([readonly])').first();
        if (await file.count()) {
          await file.setInputFiles({
            name: '不適切な形式'.repeat(12) + '.exe',
            mimeType: 'application/octet-stream',
            buffer: Buffer.from('invalid'),
          });
          await expect(file).toHaveAttribute('aria-invalid', 'true');
          await expect(file).toHaveAccessibleDescription(/対応するファイル/);
        } else if (await number.count()) {
          await number.fill('-1');
          await runConversion(page);
        } else if (await color.count()) await color.fill('#invalid');
        else if (await text.count()) {
          await text.fill('x'.repeat(100001));
          await runConversion(page);
        } else {
          await page.getByRole('slider').first().focus();
          await page.keyboard.press('End');
        }
        if (slug !== 'border-radius-maker')
          await expect(page.getByRole('alert').first()).toBeVisible();
        await assertUsable(page, `${slug} error or boundary`);
        // axe may move focus while probing controls; capture the normal page presentation.
        await page.getByRole('main').focus();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: testInfo.outputPath(`${slug}-error-${width}-${theme}.png`),
          fullPage: true,
        });
        await page.getByRole('button', { name: 'リセット', exact: true }).click();
        await expect(page.getByRole('alert')).toHaveCount(0);
      }
    });
  }
