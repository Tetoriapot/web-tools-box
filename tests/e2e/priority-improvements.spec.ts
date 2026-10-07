import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { assertUsable, runConversion, toolSlugs } from './quality-helpers';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const preview = (page: Page) =>
  page.getByRole('img', { name: '出力画像のプレビュー', exact: true });
async function waitForOutput(page: Page) {
  await expect(
    page
      .locator('.workspace-result button')
      .filter({ hasText: /コピー|保存/ })
      .first(),
  ).toBeEnabled();
}
async function snapshot(page: Page) {
  return page.locator('.workspace').evaluate((workspace) => ({
    fields: Array.from(workspace.querySelectorAll('input,textarea,select')).map((node) => ({
      value: (node as HTMLInputElement).value,
      checked: (node as HTMLInputElement).checked,
    })),
    result: (workspace.querySelector('.workspace-result') as HTMLElement).innerText,
    images: Array.from(workspace.querySelectorAll('canvas')).map((canvas) => canvas.toDataURL()),
    styles: Array.from(workspace.querySelectorAll('[style]')).map((node) =>
      node.getAttribute('style'),
    ),
  }));
}
async function imageFile(page: Page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 160;
    const context = canvas.getContext('2d')!;
    const pixels = context.createImageData(240, 160);
    for (let i = 0; i < pixels.data.length; i += 4) {
      pixels.data[i] = (i * 13) % 251;
      pixels.data[i + 1] = (i * 37) % 239;
      pixels.data[i + 2] = (i * 7) % 233;
      pixels.data[i + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
    return canvas.toDataURL();
  });
  return {
    name: 'private.png',
    mimeType: 'image/png',
    buffer: Buffer.from(data.split(',')[1]!, 'base64'),
  };
}

test('all twenty tools restore their fields and output after reset', async ({ page }) => {
  test.setTimeout(180_000);
  for (const slug of await toolSlugs(page)) {
    await page.goto(`/tools/${slug}`);
    await button(page, 'サンプル').click();
    await runConversion(page);
    await waitForOutput(page);
    const before = await snapshot(page);
    await button(page, 'リセット').click();
    await expect(button(page, '元に戻す')).toBeVisible();
    await button(page, '元に戻す').press('Enter');
    await waitForOutput(page);
    expect(await snapshot(page), slug).toEqual(before);
    await expect(button(page, '元に戻す')).toHaveCount(0);
    await expect(button(page, 'リセット')).toBeFocused();
  }
});

test('sample undo preserves custom text, errors and generated output, then expires on editing or navigation', async ({
  page,
}) => {
  await page.goto('/tools/url-encoder');
  const input = page.getByRole('textbox', { name: '変換するテキスト' });
  await input.fill('自分の入力 🌿 /?x=1&y=2');
  await button(page, 'エンコードする').click();
  const original = await snapshot(page);
  await button(page, 'サンプル').click();
  await button(page, 'Help（ヘルプ）').click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /モードに切り替える/ }).click();
  await button(page, '元に戻す').click();
  expect(await snapshot(page)).toEqual(original);
  await expect(button(page, 'サンプル')).toBeFocused();
  await button(page, 'サンプル').click();
  await input.fill('次の編集');
  await expect(button(page, '元に戻す')).toHaveCount(0);
  await page.getByRole('radio', { name: 'デコード', exact: true }).check();
  await input.fill('%broken');
  await button(page, 'デコードする').click();
  await expect(page.getByRole('alert')).toBeVisible();
  const invalid = await snapshot(page);
  await button(page, 'リセット').click();
  await button(page, '元に戻す').click();
  expect(await snapshot(page)).toEqual(invalid);
  await expect(page.getByRole('alert')).toBeVisible();
  await button(page, 'サンプル').click();
  await page.getByRole('link', { name: 'ツール一覧に戻る' }).click();
  await page.getByRole('link', { name: /URL Encode \/ Decode/ }).click();
  await expect(input).toHaveValue('');
  await expect(button(page, '元に戻す')).toHaveCount(0);
});

test('local images and settings can be restored after sample and reset without saving input', async ({
  page,
}) => {
  await page.goto('/tools/image-resizer');
  await page.locator('input[type=file]').setInputFiles(await imageFile(page));
  await page.getByRole('spinbutton', { name: '幅（px）', exact: true }).fill('120');
  await page.getByRole('radio', { name: 'WebP', exact: true }).check();
  await waitForOutput(page);
  const original = await snapshot(page);
  for (const name of ['サンプル', 'リセット']) {
    await button(page, name).click();
    await button(page, '元に戻す').click();
    await waitForOutput(page);
    expect(await snapshot(page)).toEqual(original);
    await expect(page.locator('.image-file-note')).toContainText('private.png');
  }
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key !== 'web-tools-box.theme'),
    ),
  ).toEqual([]);
});

test('compression preview and byte size match the downloaded file after quality and format changes', async ({
  page,
}) => {
  await page.goto('/tools/image-format-converter');
  const file = await imageFile(page);
  await page.locator('input[type=file]').setInputFiles(file);
  for (const format of ['JPEG', 'WebP', 'PNG']) {
    await page.getByRole('radio', { name: format, exact: true }).check();
    if (format !== 'PNG') {
      await page.getByRole('slider', { name: '画質', exact: true }).focus();
      await page.keyboard.press('Home');
    }
    await waitForOutput(page);
    const expectedPixels = await preview(page).evaluate((node) =>
      (node as HTMLCanvasElement).toDataURL(),
    );
    const ready = page.waitForEvent('download');
    await button(page, `${format.toUpperCase()}を保存`).click();
    const download = await ready;
    const bytes = await readFile((await download.path())!);
    await expect(page.locator('.image-size-summary')).toContainText(
      `元ファイル：${file.buffer.length.toLocaleString('ja-JP')} B`,
    );
    await expect(page.locator('.image-size-summary strong')).toHaveText(
      `${bytes.length.toLocaleString('ja-JP')} B`,
    );
    const savedPixels = await page.evaluate(
      async ({ data, mime }) => {
        const bitmap = await createImageBitmap(new Blob([new Uint8Array(data)], { type: mime }));
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
        bitmap.close();
        return canvas.toDataURL();
      },
      { data: [...bytes], mime: `image/${format.toLowerCase()}` },
    );
    expect(savedPixels).toBe(expectedPixels);
  }
  await button(page, 'サンプル').click();
  await waitForOutput(page);
  await expect(page.locator('.image-size-summary')).toContainText('比較用の元ファイルなし');
  await expect(page.locator('.image-size-summary')).not.toContainText('%');
  await button(page, 'リセット').click();
  await expect(page.locator('.image-size-summary')).toHaveCount(0);
  await expect(button(page, 'PNGを保存')).toBeDisabled();
});

test('mobile jumps move focus to visible content without changing input or undo', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  for (const width of [360, 768]) {
    await page.setViewportSize({ width, height: 800 });
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      await page.goto('/tools/code-shot');
      await page
        .getByRole('textbox', { name: 'コード・テキスト' })
        .fill('const original = "自分のコード";');
      await button(page, 'サンプル').click();
      const result = page.getByRole('region', { name: '出力結果' });
      await page.getByRole('link', { name: '結果へ', exact: true }).click();
      await expect(result).toBeFocused();
      expect((await result.boundingBox())!.y).toBeGreaterThanOrEqual(70);
      await waitForOutput(page);
      await page.keyboard.press('Tab');
      await expect(button(page, 'PNGを保存')).toBeFocused();
      await page.getByRole('link', { name: '入力・設定へ', exact: true }).click();
      await expect(page.getByRole('region', { name: '入力・設定', exact: true })).toBeFocused();
      await button(page, '元に戻す').click();
      await expect(page.getByRole('textbox', { name: 'コード・テキスト' })).toHaveValue(
        'const original = "自分のコード";',
      );
      await assertUsable(page, `${width}-${colorScheme}`);
      await page.screenshot({
        path: testInfo.outputPath(`jumps-${width}-${colorScheme}.png`),
        fullPage: true,
      });
    }
  }
});

test('directory starts with search, Japanese card titles and task-based queries', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'ツール一覧' })).toBeInViewport();
  await expect(page.locator('.hero')).toHaveCount(0);
  const search = page.getByRole('searchbox', { name: 'ツールを検索' });
  await expect(search).toBeInViewport();
  for (const [query, title] of [
    ['画像を軽くする', '画像形式変換'],
    ['サイトアイコン', 'ファビコン作成'],
    ['コードを画像にする', 'コード画像化'],
  ]) {
    await search.fill(query!);
    await expect(page.locator('.tool-card')).toHaveCount(1);
    await expect(page.locator('.tool-card h3')).toHaveText(title!);
  }
  await search.fill('');
  await expect(page.locator('.tool-card')).toHaveCount(20);
  await page.screenshot({ path: testInfo.outputPath('directory.png'), fullPage: true });
});
