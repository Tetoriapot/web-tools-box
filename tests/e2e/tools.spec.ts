import { readFile } from 'node:fs/promises';
import { expect, test } from './fixtures';

test('UUID validates bounds, generates, copies, saves CSV and resets', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/tools/uuid-generator');
  const output = page.getByRole('textbox', { name: '出力結果' });
  const count = page.getByRole('spinbutton', { name: '生成数' });
  await expect(page.getByRole('button', { name: '結果をコピー' })).toBeDisabled();
  for (const invalid of ['', '0', '101', '1.5']) {
    await count.fill(invalid);
    await page.getByRole('button', { name: 'UUIDを生成' }).click();
    await expect(page.getByRole('alert')).toContainText('1〜100');
    await expect(output).toHaveValue('');
  }
  await count.fill('100');
  await page.getByRole('button', { name: 'UUIDを生成' }).click();
  const ids = (await output.inputValue()).split('\n');
  expect(new Set(ids).size).toBe(100);
  expect(
    ids.every((id) => /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/.test(id)),
  ).toBe(true);
  await page.getByRole('button', { name: '結果をコピー' }).click();
  await expect(page.getByText('コピーしました', { exact: true })).toBeVisible();
  // Windows clipboard represents line endings as CRLF.
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(
    ids.join('\n'),
  );
  await page.getByLabel('CSV', { exact: true }).check();
  await expect(output).toHaveValue(ids.join(','));
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('uuids.csv');
  expect(await readFile((await download.path())!, 'utf8')).toBe(ids.join(','));
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await expect(page.getByText('サンプル（固定値）')).toBeVisible();
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(count).toHaveValue('5');
  await expect(output).toHaveValue('');
});

test('URL encodes, decodes, parses duplicate keys and refuses invalid inputs', async ({ page }) => {
  await page.goto('/tools/url-encoder');
  await page.getByRole('button', { name: 'エンコードする', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('入力');
  const input = page.getByRole('textbox', { name: '変換するテキスト' });
  const output = page.getByRole('textbox', { name: '出力結果' });
  await input.fill('日本語 +&');
  await page.getByRole('button', { name: 'エンコードする', exact: true }).click();
  await expect(output).toHaveValue(encodeURIComponent('日本語 +&'));
  await page.getByLabel('デコード', { exact: true }).check();
  await expect(output).toHaveValue('');
  await input.fill('%ZZ');
  await page.getByRole('button', { name: 'デコードする', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('デコードできません');
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await page.getByRole('button', { name: 'デコードする', exact: true }).click();
  await expect(output).toHaveValue('こんにちは Web Tools Box!');
  await page.getByLabel('クエリ解析', { exact: true }).check();
  await page
    .getByRole('textbox', { name: 'URLまたはクエリ文字列' })
    .fill('?q=a+b&tag=one&tag=two&x=%3Cscript%3E');
  await page.getByRole('button', { name: 'クエリを解析' }).click();
  await expect(page.getByRole('cell', { name: 'tag', exact: true })).toHaveCount(2);
  await expect(page.getByRole('cell', { name: '<script>', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'a b', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(output).toHaveValue('');
});

test('text case converts live, handles Unicode and keeps lines', async ({ page }) => {
  await page.goto('/tools/text-case-converter');
  const input = page.getByRole('textbox', { name: '変換するテキスト' });
  const output = page.getByRole('textbox', { name: '出力結果' });
  await input.fill('XMLHttpRequest\n日本語 テキスト');
  await page.getByLabel('snake_case', { exact: true }).check();
  await expect(output).toHaveValue('xml_http_request\n日本語_テキスト');
  await page.getByLabel('CONSTANT_CASE', { exact: true }).check();
  await expect(output).toHaveValue('XML_HTTP_REQUEST\n日本語_テキスト');
  await input.fill('!!!');
  await expect(page.getByRole('alert')).toContainText('文字や数字');
  await expect(output).toHaveValue('');
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await expect(output).not.toHaveValue('');
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(page.getByLabel('camelCase', { exact: true })).toBeChecked();
});

test('large text and URL inputs are bounded without crashing', async ({ page }) => {
  for (const slug of ['url-encoder', 'text-case-converter']) {
    await page.goto(`/tools/${slug}`);
    const input = page.getByRole('textbox', { name: '変換するテキスト' });
    await input.fill('a'.repeat(100_000));
    if (slug === 'url-encoder')
      await page.getByRole('button', { name: 'エンコードする', exact: true }).click();
    await expect(page.getByRole('textbox', { name: '出力結果' })).toHaveValue('a'.repeat(100_000));
    await input.fill('a'.repeat(100_001));
    if (slug === 'url-encoder')
      await page.getByRole('button', { name: 'エンコードする', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('100,000');
    await expect(page.getByRole('button', { name: '結果をコピー' })).toBeDisabled();
  }
});

test('gradient supports multiple stops, invalid colors, radial output, copy and CSS download', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/tools/gradient-maker');
  const css = page.getByRole('textbox', { name: '生成されたCSS' });
  await expect(css).toHaveValue(/linear-gradient\(135deg/);
  for (let index = 0; index < 6; index++)
    await page.getByRole('button', { name: '色を追加' }).click();
  await expect(page.getByRole('button', { name: '色を追加' })).toBeDisabled();
  await expect(page.getByRole('textbox', { name: /^カラー \d$/ })).toHaveCount(8);
  await page.getByRole('textbox', { name: 'カラー 1', exact: true }).fill('#nope');
  await expect(page.getByRole('alert')).toContainText('HEX');
  await expect(page.getByRole('button', { name: 'CSSをコピー' })).toBeDisabled();
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await expect(page.getByRole('textbox', { name: /^カラー \d$/ })).toHaveCount(3);
  await page.getByLabel('円形 / Radial').check();
  await expect(css).toHaveValue(/radial-gradient\(circle/);
  await expect(page.getByRole('slider', { name: '角度' })).toHaveCount(0);
  await page.getByRole('button', { name: 'CSSをコピー' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await css.inputValue());
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('gradient.css');
  expect(await readFile((await download.path())!, 'utf8')).toBe(await css.inputValue());
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(css).toHaveValue('background: linear-gradient(135deg, #91b8cb 0%, #eac0b5 100%);');
  await expect(page.getByRole('button', { name: 'カラー 1 を削除' })).toBeDisabled();
});

test('box shadow supports keyboard sliders and inset; output is independent of theme', async ({
  page,
}) => {
  await page.goto('/tools/box-shadow-maker');
  const css = page.getByRole('textbox', { name: '生成されたCSS' });
  const slider = page.getByRole('slider', { name: '水平方向（X）' });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(css).toHaveValue(/box-shadow: 1px/);
  await page.getByLabel('内側に影をつける（inset）').check();
  await expect(css).toHaveValue(/box-shadow: inset/);
  const beforeTheme = await css.inputValue();
  const previewColor = await page
    .getByRole('img', { name: 'ボックスシャドウのプレビュー' })
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.getByRole('button', { name: /モードに切り替える/ }).click();
  await expect(css).toHaveValue(beforeTheme);
  expect(
    await page
      .getByRole('img', { name: 'ボックスシャドウのプレビュー' })
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe(previewColor);
  await page.getByRole('textbox', { name: '影の色', exact: true }).fill('red;');
  await expect(page.getByRole('alert')).toContainText('HEX');
  await expect(page.getByRole('button', { name: 'CSSをコピー' })).toBeDisabled();
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await expect(css).toHaveValue(/12px 16px 30px -6px/);
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(css).toHaveValue('box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.15);');
});

test('tool inputs do not leak across routes or into storage', async ({ page }) => {
  await page.goto('/tools/url-encoder');
  await page.getByRole('textbox', { name: '変換するテキスト' }).fill('private input 日本語');
  await page.getByRole('link', { name: 'ツール一覧に戻る' }).click();
  await page.getByRole('link', { name: /Text Case Converter/ }).click();
  await expect(page.getByRole('textbox', { name: '変換するテキスト' })).toHaveValue('');
  await page.getByRole('link', { name: 'ツール一覧に戻る' }).click();
  await page.getByRole('link', { name: /URL Encode/ }).click();
  await expect(page.getByRole('textbox', { name: '変換するテキスト' })).toHaveValue('');
  expect(
    await page.evaluate(() =>
      JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }),
    ),
  ).not.toContain('private input');
});

test('unavailable clipboard and crypto show an actionable error', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined });
    document.execCommand = () => false;
    Object.defineProperty(window, 'crypto', { value: undefined });
  });
  await page.goto('/tools/uuid-generator');
  await page.getByRole('button', { name: 'UUIDを生成' }).click();
  await expect(page.getByRole('alert')).toContainText('安全な乱数');
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await page.getByRole('button', { name: '結果をコピー' }).click();
  await expect(page.getByText(/結果を選択して手動でコピー/)).toBeVisible();
});

test('theme works when localStorage is disabled', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Storage blocked');
      },
    });
  });
  await page.goto('/');
  const original = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: /モードに切り替える/ }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    original === 'light' ? 'dark' : 'light',
  );
});

for (const tool of [
  { slug: 'url-encoder', filename: 'url-result.txt', output: '出力結果', copy: '結果をコピー' },
  {
    slug: 'text-case-converter',
    filename: 'converted-text.txt',
    output: '出力結果',
    copy: '結果をコピー',
  },
  {
    slug: 'box-shadow-maker',
    filename: 'box-shadow.css',
    output: '生成されたCSS',
    copy: 'CSSをコピー',
  },
]) {
  test(`${tool.slug} copies and saves the exact sample result`, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`/tools/${tool.slug}`);
    await page.getByRole('button', { name: 'サンプル', exact: true }).click();
    if (tool.slug === 'url-encoder')
      await page.getByRole('button', { name: 'エンコードする', exact: true }).click();
    const expected = await page.getByRole('textbox', { name: tool.output }).inputValue();
    expect(expected).not.toBe('');
    await page.getByRole('button', { name: tool.copy, exact: true }).click();
    await expect(page.getByText('コピーしました', { exact: true })).toBeVisible();
    expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(
      expected,
    );
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(tool.filename);
    expect(await readFile((await download.path())!, 'utf8')).toBe(expected);
  });
}
