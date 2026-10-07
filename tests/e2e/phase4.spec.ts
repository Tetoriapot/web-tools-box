import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

test('JSON validates, formats, searches, folds and copies exact escaped paths', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/tools/json-visualizer');
  await page.getByRole('button', { name: '検証して表示' }).click();
  await expect(page.getByRole('alert')).toContainText('入力');
  const input = page.getByRole('textbox', { name: 'JSON', exact: true });
  await input.fill('{\n"x":1,}');
  await page.getByRole('button', { name: '検証して表示' }).click();
  await expect(page.getByRole('alert')).toContainText('2行目');
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await page.getByRole('button', { name: '検証して表示' }).click();
  const output = page.getByRole('textbox', { name: '生成されたJSON' });
  const pretty = await output.inputValue();
  await page.getByRole('radio', { name: '圧縮', exact: true }).check();
  await expect(output).toHaveValue(JSON.stringify(JSON.parse(pretty)));
  await page.getByRole('button', { name: 'すべて折り畳む' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('list', { name: 'JSONの構造' }).getByRole('listitem')).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'キーを検索' }).fill('NAME');
  await expect(page.getByRole('status').filter({ hasText: '件のキー' })).toContainText('2 件');
  await page
    .getByRole('button', { name: 'パスをコピー: $["tools"][0]["name"]', exact: true })
    .click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('$["tools"][0]["name"]');
  await page.getByRole('searchbox', { name: 'キーを検索' }).fill('no-match');
  await expect(page.getByRole('list', { name: 'JSONの構造' }).getByRole('listitem')).toHaveCount(0);
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(output).toHaveValue('');
  await expect(input).toHaveValue('');
  await input.fill(JSON.stringify(Array.from({ length: 500 }, (_, i) => ({ name: `item${i}` }))));
  await page.getByRole('button', { name: '検証して表示' }).click();
  await expect(page.getByRole('list', { name: 'JSONの構造' }).getByRole('listitem')).toHaveCount(
    200,
  );
  await page.getByRole('button', { name: /次の200項目/ }).click();
  await expect(page.getByRole('list', { name: 'JSONの構造' }).getByRole('listitem')).toHaveCount(
    400,
  );
});

test('JSON/YAML supports both directions and rejects lossy or malicious input', async ({
  page,
}) => {
  await page.goto('/tools/json-yaml-converter');
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  const original = await page.getByRole('textbox', { name: 'JSON', exact: true }).inputValue();
  await page.getByRole('button', { name: 'YAMLに変換' }).click();
  await expect(page.getByRole('textbox', { name: '生成されたYAML' })).toHaveValue(
    /localOnly: true/,
  );
  await page.getByRole('button', { name: '結果を入力にして逆変換' }).click();
  await page.getByRole('button', { name: 'JSONに変換' }).click();
  expect(
    JSON.parse(await page.getByRole('textbox', { name: '生成されたJSON' }).inputValue()),
  ).toEqual(JSON.parse(original));
  for (const input of ['a: 1\na: 2', 'a: [broken', 'a: &loop [*loop]', 'a: .nan', '1: value']) {
    await page.getByRole('textbox', { name: 'YAML', exact: true }).fill(input);
    await page.getByRole('button', { name: 'JSONに変換' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'JSONをコピー' })).toBeDisabled();
  }
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'JSON → YAML' })).toBeChecked();
  await expect(page.getByRole('textbox', { name: 'JSON', exact: true })).toHaveValue('');
});

test('Base64 round-trips Japanese and emoji, Data URLs, invalid and large text', async ({
  page,
}) => {
  await page.goto('/tools/base64-converter');
  await page.getByRole('button', { name: 'エンコードする' }).click();
  await expect(page.getByRole('alert')).toContainText('入力');
  const input = page.getByRole('textbox', { name: 'テキスト', exact: true });
  const text = '日本語 🌿\n改行';
  await input.fill(text);
  await page.getByRole('checkbox', { name: 'Data URLで出力する' }).check();
  await page.getByRole('button', { name: 'エンコードする' }).click();
  const encoded = await page.getByRole('textbox', { name: '生成されたBase64' }).inputValue();
  expect(encoded).toBe(
    `data:text/plain;charset=utf-8;base64,${Buffer.from(text).toString('base64')}`,
  );
  await page.getByRole('radio', { name: 'デコード', exact: true }).check();
  const source = page.getByRole('textbox', { name: 'Base64またはData URL' });
  await source.fill(encoded);
  await page.getByRole('button', { name: 'デコードする' }).click();
  await expect(page.getByRole('textbox', { name: '生成されたテキスト' })).toHaveValue(text);
  for (const invalid of ['???', 'Zh==', '/w==', 'data:image/svg+xml,hello']) {
    await source.fill(invalid);
    await page.getByRole('button', { name: 'デコードする' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'テキストをコピー' })).toBeDisabled();
  }
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await input.fill('日'.repeat(100_000));
  await page.getByRole('button', { name: 'エンコードする' }).click();
  expect((await page.getByRole('textbox', { name: '生成されたBase64' }).inputValue()).length).toBe(
    400_000,
  );
  await input.fill('x'.repeat(100_001));
  await page.getByRole('button', { name: 'エンコードする' }).click();
  await expect(page.getByRole('alert')).toContainText('100,000');
});

test('Base64 validates raster bytes and downloads the exact decoded image', async ({
  page,
}, testInfo) => {
  await page.goto('/tools/base64-converter');
  const samples = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 48;
    const context = canvas.getContext('2d')!;
    context.fillStyle = '#196b54';
    context.fillRect(0, 0, 64, 48);
    return ['image/png', 'image/jpeg', 'image/webp'].map((mime) => ({
      mime,
      uri: canvas.toDataURL(mime),
    }));
  });
  await page.getByRole('radio', { name: '画像', exact: true }).check();
  const file = page.locator('input[type=file]');
  for (const sample of samples) {
    const bytes = Buffer.from(sample.uri.split(',')[1]!, 'base64');
    await file.setInputFiles({
      name: `sample.${sample.mime.split('/')[1]}`,
      mimeType: sample.mime,
      buffer: bytes,
    });
    await expect(page.getByRole('img', { name: 'Base64画像のプレビュー' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '生成されたBase64' })).toHaveValue(
      bytes.toString('base64'),
    );
  }
  await file.setInputFiles({
    name: 'broken.png',
    mimeType: 'image/png',
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]),
  });
  await expect(page.getByRole('alert')).toContainText('破損');
  await expect(page.getByRole('img', { name: 'Base64画像のプレビュー' })).toHaveCount(0);
  await file.setInputFiles({
    name: 'fake.png',
    mimeType: 'image/png',
    buffer: Buffer.from('<svg onload="alert(1)"/>'),
  });
  await expect(page.getByRole('alert')).toContainText('画像データ');
  await file.setInputFiles({
    name: 'large.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole('alert')).toContainText('バイト');
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Base64画像のプレビュー' })).toBeVisible();
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: testInfo.outputPath(`base64-image-${theme}.png`),
      fullPage: true,
    });
  }
  await page.getByRole('radio', { name: 'デコード', exact: true }).check();
  await page.getByRole('textbox', { name: 'Base64またはData URL' }).fill(samples[0]!.uri);
  await page.getByRole('button', { name: 'デコードする' }).click();
  await expect(page.getByRole('img', { name: 'Base64画像のプレビュー' })).toBeVisible();
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: '画像を保存', exact: true }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe('decoded.png');
  expect(await readFile((await download.path())!)).toEqual(
    Buffer.from(samples[0]!.uri.split(',')[1]!, 'base64'),
  );
});

test('Markdown renders live, sanitizes XSS and avoids all automatic network requests', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/tools/markdown-preview');
  const input = page.getByRole('textbox', { name: 'Markdown', exact: true });
  const text =
    '# 安全なプレビュー\n\n**日本語**\n\n![写真](https://example.invalid/secret)\n\n<script>window.pwned=true</script><img src="https://example.invalid/leak" onerror="window.pwned=true"><iframe src="https://example.invalid"></iframe><p style="background:url(https://example.invalid)">本文</p>\n\n[危険](javascript:alert%281%29)\n\n```js\nalert("コードは文字として表示");\n```';
  await input.fill(text);
  const article = page.getByRole('article', { name: 'Markdownのプレビュー' });
  await expect(article.getByRole('heading', { name: '安全なプレビュー' })).toBeVisible();
  await expect(article).toContainText('[画像: 写真]');
  await expect(article.locator('script,img,iframe,style,[style]')).toHaveCount(0);
  expect(await page.evaluate(() => 'pwned' in window)).toBe(false);
  await page.getByRole('button', { name: 'HTMLをコピー' }).click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(
    await article.innerHTML(),
  );
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe('document.md');
  expect(await readFile((await download.path())!, 'utf8')).toBe(text);
  await input.fill('x'.repeat(100_001));
  await expect(page.getByRole('alert')).toContainText('100,000');
  await expect(page.getByRole('button', { name: 'HTMLをコピー' })).toBeDisabled();
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(article).toHaveCount(0);
});

for (const tool of [
  {
    slug: 'json-visualizer',
    label: 'JSON',
    extension: 'json',
    content: '{"日本語":true}',
    action: '検証して表示',
    format: 'JSON',
    filename: 'formatted.json',
  },
  {
    slug: 'json-yaml-converter',
    label: 'JSON',
    extension: 'json',
    content: '{"日本語":true}',
    action: 'YAMLに変換',
    format: 'YAML',
    filename: 'converted.yaml',
  },
  {
    slug: 'markdown-preview',
    label: 'Markdown',
    extension: 'md',
    content: '# 日本語\n\n文章',
    action: '',
    format: 'HTML',
    filename: 'document.md',
  },
]) {
  test(`${tool.slug} imports text files and handles invalid/empty/binary/oversized files`, async ({
    page,
  }) => {
    await page.goto(`/tools/${tool.slug}`);
    const input = page.getByRole('textbox', { name: tool.label, exact: true });
    const file = page.locator('input[type=file]');
    await file.setInputFiles({
      name: `sample.${tool.extension}`,
      mimeType: 'text/plain',
      buffer: Buffer.from(tool.content),
    });
    await expect(input).toHaveValue(tool.content);
    if (tool.action) await page.getByRole('button', { name: tool.action }).click();
    await expect(page.getByRole('button', { name: `${tool.format}をコピー` })).toBeEnabled();
    for (const sample of [
      { name: 'wrong.exe', buffer: Buffer.from('no') },
      { name: `empty.${tool.extension}`, buffer: Buffer.alloc(0) },
      { name: `binary.${tool.extension}`, buffer: Buffer.from([255, 0, 254]) },
      { name: `large.${tool.extension}`, buffer: Buffer.alloc(400_001, 97) },
    ]) {
      await file.setInputFiles({ ...sample, mimeType: 'text/plain' });
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByRole('button', { name: `${tool.format}をコピー` })).toBeDisabled();
    }
    await page.getByRole('button', { name: 'リセット', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await file.setInputFiles({
      name: `sample.${tool.extension}`,
      mimeType: 'text/plain',
      buffer: Buffer.from(tool.content),
    });
    await expect(input).toHaveValue(tool.content);
  });
}

for (const tool of [
  { slug: 'json-visualizer', action: '検証して表示', format: 'JSON', filename: 'formatted.json' },
  { slug: 'json-yaml-converter', action: 'YAMLに変換', format: 'YAML', filename: 'converted.yaml' },
  { slug: 'base64-converter', action: 'エンコードする', format: 'Base64', filename: 'base64.txt' },
]) {
  test(`${tool.slug} copies and downloads its exact output`, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`/tools/${tool.slug}`);
    await page.getByRole('button', { name: 'サンプル', exact: true }).click();
    await page.getByRole('button', { name: tool.action }).click();
    const output = await page
      .getByRole('textbox', { name: `生成された${tool.format}` })
      .inputValue();
    await page.getByRole('button', { name: `${tool.format}をコピー` }).click();
    expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(
      output,
    );
    const event = page.waitForEvent('download');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    const download = await event;
    expect(download.suggestedFilename()).toBe(tool.filename);
    expect(await readFile((await download.path())!, 'utf8')).toBe(output);
  });
}

test('dropped files are local, old reads cannot overwrite reset, and tools isolate state', async ({
  page,
}) => {
  await page.goto('/tools/json-visualizer');
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(['{"drop":true}'], 'sample.json', { type: 'application/json' }));
    return data;
  });
  await page
    .locator('input[type=file]')
    .locator('..')
    .dispatchEvent('drop', { dataTransfer: transfer });
  await expect(page.getByRole('textbox', { name: 'JSON', exact: true })).toHaveValue(
    '{"drop":true}',
  );
  await page.evaluate(() => {
    const read = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = async function () {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return read.call(this);
    };
  });
  await page.locator('input[type=file]').setInputFiles({
    name: 'slow.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"late":true}'),
  });
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await page.waitForTimeout(400);
  await expect(page.getByRole('textbox', { name: 'JSON', exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await page.getByRole('link', { name: 'ツール一覧に戻る' }).click();
  await expect(page.locator('.tool-card:not(.planned)')).toHaveCount(20);
  await page.getByRole('link', { name: /Markdown Preview/ }).click();
  await expect(page.getByRole('textbox', { name: 'Markdown', exact: true })).toHaveValue('');
  await page.getByRole('link', { name: 'ツール一覧に戻る' }).click();
  await page.getByRole('link', { name: /JSON Visualizer/ }).click();
  await expect(page.getByRole('textbox', { name: 'JSON', exact: true })).toHaveValue('');
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key !== 'web-tools-box.theme'),
    ),
  ).toEqual([]);
});
