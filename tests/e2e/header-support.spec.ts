import { readFileSync } from 'node:fs';
import { test, expect } from './fixtures';
import { assertUsable } from './quality-helpers';

const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

test('right header actions open Help and updates without losing the current tool input', async ({
  page,
}) => {
  await page.goto('/tools/url-encoder');
  const input = page.getByRole('textbox', { name: '変換するテキスト' });
  await input.fill('保持する入力 / 日本語 ✓');
  const actions = page.getByRole('group', { name: '表示とサポート' });
  await expect(actions.getByRole('button')).toHaveCount(3);
  for (const name of ['Help（ヘルプ）', '更新情報']) {
    const trigger = actions.getByRole('button', { name, exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { level: 2, name, exact: true })).toBeFocused();
    if (name === 'Help（ヘルプ）') {
      await expect(dialog).toContainText('使用中：URLエンコード・デコード');
      await expect(dialog).toContainText('入力した画像・テキストを外部に送信しません');
    } else {
      await expect(dialog).toContainText(`現在表示しているバージョン：v${version}`);
      await expect(dialog.locator('time').first()).toHaveAttribute('dateTime', '2026-10-07');
    }
    await page.keyboard.press('Tab');
    const close = dialog.getByRole('button', { name: `${name}を閉じる` });
    await expect(close).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(input).toHaveValue('保持する入力 / 日本語 ✓');
    await expect(page).toHaveURL('/tools/url-encoder');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    // Reopening and closing with the visible button must work too.
    await trigger.press('Enter');
    await dialog.getByRole('button', { name: `${name}を閉じる` }).click();
    await expect(trigger).toBeFocused();
  }
  const currentTheme = await page.locator('html').getAttribute('data-theme');
  await actions.getByRole('button', { name: /モードに切り替える/ }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    currentTheme === 'dark' ? 'light' : 'dark',
  );
  await expect(input).toHaveValue('保持する入力 / 日本語 ✓');
});

test('header and dialogs fit all target widths and both themes with readable controls', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  for (const width of [320, 360, 768, 1024, 1440]) {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ colorScheme });
      await page.goto('/');
      const actions = page.getByRole('group', { name: '表示とサポート' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      for (const button of await actions.getByRole('button').all())
        await expect(button).toBeInViewport();
      expect(
        await actions.evaluate((element) => {
          const header = element.closest('.header-inner')!;
          const padding = parseFloat(getComputedStyle(header).paddingRight);
          return (
            Math.abs(
              element.getBoundingClientRect().right -
                (header.getBoundingClientRect().right - padding),
            ) < 2
          );
        }),
      ).toBe(true);
      await assertUsable(page, `header ${width} ${colorScheme}`);
      for (const name of ['更新情報', 'Help（ヘルプ）']) {
        await actions.getByRole('button', { name, exact: true }).click();
        const dialog = page.getByRole('dialog', { name, exact: true });
        await expect(dialog).toBeVisible();
        expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
          true,
        );
        await assertUsable(page, `${name} ${width} ${colorScheme}`);
        await page.screenshot({
          path: testInfo.outputPath(
            `${name === '更新情報' ? 'updates' : 'help'}-${width}-${colorScheme}.png`,
          ),
        });
        // Close remains accessible while reading the end of a long dialog.
        await dialog.evaluate((element) => {
          element.scrollTop = element.scrollHeight;
        });
        await expect(dialog.getByRole('button', { name: `${name}を閉じる` })).toBeInViewport();
        await dialog.getByRole('button', { name: `${name}を閉じる` }).click();
      }
    }
  }
});

test('help and update information also work offline', async ({ page, context }) => {
  await page.goto('/about');
  await expect(page.getByRole('status')).toHaveText('オフラインで利用できます。', {
    timeout: 20_000,
  });
  await context.setOffline(true);
  await page.goto('/tools/gradient-maker');
  await page.getByRole('button', { name: 'Help（ヘルプ）' }).click();
  await expect(page.getByRole('dialog')).toContainText('使用中：グラデーション作成');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '更新情報', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(`v${version}`);
  await expect(page.getByRole('dialog').getByRole('status')).toHaveText(
    'オフラインで利用できます。',
  );
});

test('help remains dismissible when the native modal API is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { value: undefined });
  });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Help（ヘルプ）' });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).not.toContainText('使用中：');
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Help（ヘルプ）を閉じる' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(
    await page
      .locator('#root')
      .evaluate((element) => element instanceof HTMLElement && element.inert),
  ).toBe(false);
});
