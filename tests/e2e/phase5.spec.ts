import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import JSZip from 'jszip';
import jsQR from 'jsqr';
import { expect, test } from './fixtures';

const preview = (page: Page) =>
  page.getByRole('img', { name: '出力画像のプレビュー', exact: true });
async function imageFile(page: Page, mime = 'image/png', width = 80, height = 40) {
  const uri = await page.evaluate(
    ({ mime, width, height }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#ff0000';
      context.fillRect(0, 0, width / 2, height);
      return canvas.toDataURL(mime);
    },
    { mime, width, height },
  );
  return {
    name: `input.${mime.split('/')[1]}`,
    mimeType: mime,
    buffer: Buffer.from(uri.split(',')[1]!, 'base64'),
  };
}
async function expectSize(page: Page, width: number, height: number) {
  await expect(preview(page)).toBeVisible();
  await expect
    .poll(() =>
      preview(page).evaluate((node) => ({
        width: (node as HTMLCanvasElement).width,
        height: (node as HTMLCanvasElement).height,
      })),
    )
    .toEqual({ width, height });
}
async function pixel(page: Page, x: number, y: number) {
  return preview(page).evaluate(
    (node, { x, y }) => [
      ...(node as HTMLCanvasElement).getContext('2d')!.getImageData(x, y, 1, 1).data,
    ],
    { x, y },
  );
}
async function download(page: Page, label: string) {
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: label, exact: true }).click();
  const file = await event;
  return { name: file.suggestedFilename(), bytes: await readFile((await file.path())!) };
}
async function inspectImage(page: Page, bytes: Buffer, type: string) {
  return page.evaluate(
    async ({ bytes, type }) => {
      const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type }));
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      return {
        width: canvas.width,
        height: canvas.height,
        corner: [...context.getImageData(canvas.width - 1, canvas.height - 1, 1, 1).data],
      };
    },
    { bytes: [...bytes], type },
  );
}

test('format conversion writes real PNG/JPEG/WebP with correct dimensions and transparency', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/tools/image-format-converter');
  await page.locator('input[type=file]').setInputFiles(await imageFile(page));
  await expectSize(page, 80, 40);
  await page.getByRole('spinbutton', { name: '幅（px）', exact: true }).fill('160');
  await expect(page.getByRole('spinbutton', { name: '高さ（px）', exact: true })).toHaveValue('80');
  await expectSize(page, 160, 80);
  const png = await download(page, 'PNGを保存');
  expect(png.name).toBe('converted.png');
  expect([...png.bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(await inspectImage(page, png.bytes, 'image/png')).toEqual({
    width: 160,
    height: 80,
    corner: [0, 0, 0, 0],
  });
  await page.getByRole('radio', { name: 'JPEG', exact: true }).check();
  await page.getByRole('textbox', { name: '透明部分の背景色', exact: true }).fill('#00ff00');
  // The preview now includes JPEG's small lossy color shifts.
  await expect.poll(async () => (await pixel(page, 159, 79))[1]).toBeGreaterThan(250);
  const jpeg = await download(page, 'JPEGを保存');
  expect([...jpeg.bytes.subarray(0, 3)]).toEqual([255, 216, 255]);
  const jpgImage = await inspectImage(page, jpeg.bytes, 'image/jpeg');
  expect(jpgImage.width).toBe(160);
  expect(jpgImage.corner[1]).toBeGreaterThan(250);
  expect(jpgImage.corner[3]).toBe(255);
  expect(await pixel(page, 159, 79)).toEqual(jpgImage.corner);
  await page.getByRole('radio', { name: 'WebP', exact: true }).check();
  const webp = await download(page, 'WEBPを保存');
  expect(webp.bytes.toString('ascii', 0, 4)).toBe('RIFF');
  expect(webp.bytes.toString('ascii', 8, 12)).toBe('WEBP');
  expect((await inspectImage(page, webp.bytes, 'image/webp')).corner[3]).toBe(0);
  await page.getByRole('button', { name: '画像をコピー', exact: true }).click();
  await expect(page.getByText('画像をコピーしました', { exact: true })).toBeVisible();
  expect(await page.evaluate(async () => (await navigator.clipboard.read())[0]!.types)).toContain(
    'image/png',
  );
  await page.getByRole('checkbox', { name: '元画像の縦横比を固定' }).uncheck();
  await page.getByRole('spinbutton', { name: '高さ（px）', exact: true }).fill('100');
  await expectSize(page, 160, 100);
  await page.getByRole('spinbutton', { name: '幅（px）', exact: true }).fill('');
  await expect(page.getByRole('alert')).toContainText('サイズ');
  await expect(page.getByRole('button', { name: 'WEBPを保存' })).toBeDisabled();
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(preview(page)).toHaveCount(0);
});

test('resizer applies percentage, aspect lock, fit, contain and cover without distortion', async ({
  page,
}) => {
  await page.goto('/tools/image-resizer');
  await page.locator('input[type=file]').setInputFiles(await imageFile(page));
  await expectSize(page, 80, 40);
  await page.getByRole('radio', { name: '割合（%）' }).check();
  await page.getByRole('spinbutton', { name: '元画像に対する倍率（%）' }).fill('50');
  await expectSize(page, 40, 20);
  await page.getByRole('radio', { name: 'ピクセル（px）' }).check();
  await page.getByRole('checkbox', { name: '元画像の縦横比を固定' }).uncheck();
  await page.getByRole('spinbutton', { name: '幅（px）', exact: true }).fill('100');
  await page.getByRole('spinbutton', { name: '高さ（px）', exact: true }).fill('100');
  await expectSize(page, 100, 50);
  await page.getByRole('radio', { name: 'Contain · 余白を追加' }).check();
  await expectSize(page, 100, 100);
  expect(await pixel(page, 10, 10)).toEqual([0, 0, 0, 0]);
  expect(await pixel(page, 10, 50)).toEqual([255, 0, 0, 255]);
  await page.getByRole('radio', { name: 'Cover · 中央を切り抜き' }).check();
  await expect.poll(() => pixel(page, 10, 10)).toEqual([255, 0, 0, 255]);
  const output = await download(page, 'PNGを保存');
  expect(output.name).toBe('resized.png');
  expect((await inspectImage(page, output.bytes, 'image/png')).height).toBe(100);
  await page.getByRole('spinbutton', { name: '幅（px）', exact: true }).fill('8193');
  await expect(page.getByRole('alert')).toContainText('8,192');
});

test('screenshot decoration updates ratios, shadows and exports PNG/WebP', async ({
  page,
}, testInfo) => {
  await page.goto('/tools/screenshot-decorator');
  await expect(page.getByRole('button', { name: 'PNGを保存' })).toBeDisabled();
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await expectSize(page, 928, 628);
  await page.getByRole('radio', { name: '1:1', exact: true }).check();
  await expectSize(page, 928, 928);
  await page.getByRole('slider', { name: '角丸', exact: true }).focus();
  await page.keyboard.press('End');
  await page.getByRole('radio', { name: '16:9', exact: true }).check();
  await expectSize(page, 1120, 630);
  const png = await download(page, 'PNGを保存');
  expect((await inspectImage(page, png.bytes, 'image/png')).width).toBe(1120);
  await page.getByRole('radio', { name: 'WebP', exact: true }).check();
  expect((await download(page, 'WEBPを保存')).bytes.toString('ascii', 8, 12)).toBe('WEBP');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('screenshot-decorator.png'), fullPage: true });
  await page.locator('input[type=file]').setInputFiles(await imageFile(page, 'image/png', 1, 1));
  await page.getByRole('slider', { name: '枠線の太さ' }).focus();
  await page.keyboard.press('End');
  await expect(preview(page)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('radio', { name: '自動', exact: true }).check();
  await page.locator('input[type=file]').setInputFiles(await imageFile(page, 'image/png', 8192, 1));
  await expectSize(page, 1728, 129);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('textbox', { name: '背景色', exact: true }).fill('#nothex');
  await expect(page.getByRole('alert')).toContainText('HEX');
});

test('code images preserve literal code, theme choice and react to controls', async ({ page }) => {
  await page.goto('/tools/code-shot');
  await expect(preview(page)).toBeVisible();
  const before = await preview(page).evaluate((canvas) =>
    (canvas as HTMLCanvasElement).toDataURL(),
  );
  await page.getByRole('button', { name: /モードに切り替える/ }).click();
  expect(await preview(page).evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL())).toBe(
    before,
  );
  await page.getByRole('radio', { name: 'ペーパー', exact: true }).check();
  await page.getByRole('checkbox', { name: '行番号を表示' }).uncheck();
  await page.getByRole('checkbox', { name: 'ウィンドウ風ヘッダーを表示' }).uncheck();
  await page
    .getByRole('textbox', { name: 'コード・テキスト' })
    .fill('<script>window.pwned=true</script>\n日本語 🌿');
  const file = await download(page, 'PNGを保存');
  expect(file.bytes.length).toBeGreaterThan(1000);
  expect(await page.evaluate(() => 'pwned' in window)).toBe(false);
  await page.getByRole('textbox', { name: 'コード・テキスト' }).fill('');
  await expect(page.getByRole('alert')).toContainText('入力');
  await expect(page.getByRole('button', { name: 'PNGを保存' })).toBeDisabled();
  await page.getByRole('textbox', { name: 'コード・テキスト' }).fill('x'.repeat(10001));
  await expect(page.getByRole('alert')).toContainText('10,000');
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(preview(page)).toBeVisible();
});

test('favicon ZIP contains valid multi-size PNG, ICO, manifest and HTML', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/tools/favicon-maker');
  await expectSize(page, 512, 512);
  await page.getByRole('textbox', { name: '文字・絵文字（4文字まで）' }).fill('👩‍💻');
  await page.getByRole('checkbox', { name: '背景を透明にする' }).check();
  await expect.poll(() => pixel(page, 0, 0)).toEqual([0, 0, 0, 0]);
  const file = await download(page, '一式をZIPで保存');
  expect(file.name).toBe('favicons.zip');
  const zip = await JSZip.loadAsync(file.bytes);
  expect(Object.keys(zip.files).sort()).toEqual(
    [
      'README.txt',
      'favicon-16.png',
      'favicon-32.png',
      'favicon-180.png',
      'favicon-192.png',
      'favicon-512.png',
      'favicon.ico',
      'head.html',
      'site.webmanifest',
    ].sort(),
  );
  for (const size of [16, 32, 180, 192, 512]) {
    const bytes = await zip.file(`favicon-${size}.png`)!.async('nodebuffer');
    expect(bytes.readUInt32BE(16)).toBe(size);
    expect(bytes.readUInt32BE(20)).toBe(size);
    expect((await inspectImage(page, bytes, 'image/png')).corner[3]).toBe(0);
  }
  const ico = await zip.file('favicon.ico')!.async('nodebuffer');
  expect(ico.readUInt16LE(2)).toBe(1);
  expect(ico.readUInt16LE(4)).toBe(2);
  for (const [i, size] of [16, 32].entries()) {
    const offset = ico.readUInt32LE(6 + i * 16 + 12),
      length = ico.readUInt32LE(6 + i * 16 + 8);
    expect(ico.subarray(offset, offset + length)).toEqual(
      await zip.file(`favicon-${size}.png`)!.async('nodebuffer'),
    );
  }
  expect(JSON.parse(await zip.file('site.webmanifest')!.async('text')).icons).toHaveLength(2);
  expect(await zip.file('head.html')!.async('text')).toContain('/favicon.ico');
  await page.getByRole('button', { name: 'HTMLをコピー' }).click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(
    await zip.file('head.html')!.async('text'),
  );
  const standalone = await download(page, '32px PNG');
  expect(standalone.bytes.readUInt32BE(16)).toBe(32);
  await page.getByRole('textbox', { name: '文字・絵文字（4文字まで）' }).fill('12345');
  await expect(page.getByRole('alert')).toContainText('4文字');
  await expect(page.getByRole('button', { name: '一式をZIPで保存' })).toBeDisabled();
  await page.getByRole('radio', { name: '画像', exact: true }).check();
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await expectSize(page, 512, 512);
});

test('OGP exports all six templates at 1200×630 with optional background and logo', async ({
  page,
}, testInfo) => {
  await page.goto('/tools/ogp-image-maker');
  await expectSize(page, 1200, 630);
  const outputs = new Set<string>();
  for (const name of [
    'ミニマル',
    '左右分割',
    'フレーム',
    '帯',
    'エディトリアル',
    'グラデーション',
  ]) {
    await page.getByRole('radio', { name, exact: true }).check();
    await expect(page.getByRole('button', { name: 'PNGを保存' })).toBeEnabled();
    const file = await download(page, 'PNGを保存');
    expect(file.bytes.readUInt32BE(16)).toBe(1200);
    expect(file.bytes.readUInt32BE(20)).toBe(630);
    outputs.add(file.bytes.toString('base64'));
    await page
      .locator('.preview-panel')
      .screenshot({ path: testInfo.outputPath(`ogp-${name}.png`) });
  }
  expect(outputs.size).toBe(6);
  await page
    .getByRole('group', { name: '背景画像（任意）', exact: true })
    .locator('input[type=file]')
    .setInputFiles(await imageFile(page));
  await page
    .getByRole('group', { name: 'ロゴ（任意）', exact: true })
    .locator('input[type=file]')
    .setInputFiles(await imageFile(page));
  await expect(page.getByRole('button', { name: 'PNGを保存' })).toBeEnabled();
  await page.getByRole('button', { name: 'ロゴを外す' }).click();
  await expect(page.getByRole('button', { name: 'ロゴを外す' })).toBeDisabled();
  await page.getByRole('textbox', { name: 'タイトル', exact: true }).fill('');
  await expect(page.getByRole('alert')).toContainText('タイトル');
  await page.getByRole('textbox', { name: 'タイトル', exact: true }).fill('長'.repeat(181));
  await expect(page.getByRole('alert')).toContainText('180');
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expectSize(page, 1200, 630);
});

test('QR PNG is independently decodable and SVG stays safe and scalable', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/tools/qr-code-maker');
  const text = 'https://example.com/?name=日本語&emoji=🌿';
  await page.getByRole('textbox', { name: 'URL・テキスト' }).fill(text);
  await expectSize(page, 320, 320);
  const image = await preview(page).evaluate((canvas) => [
    ...(canvas as HTMLCanvasElement).getContext('2d')!.getImageData(0, 0, 320, 320).data,
  ]);
  expect(jsQR(new Uint8ClampedArray(image), 320, 320)?.data).toBe(text);
  const png = await download(page, 'PNGを保存');
  expect(png.bytes.readUInt32BE(16)).toBe(320);
  const svg = await download(page, '保存');
  expect(svg.name).toBe('qr-code.svg');
  expect(svg.bytes.toString()).toContain('viewBox=');
  expect(svg.bytes.toString()).not.toContain(text);
  await page.getByRole('button', { name: 'SVGをコピー' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(svg.bytes.toString());
  await page.getByRole('textbox', { name: '前景色', exact: true }).fill('#ffffff');
  await expect(page.getByRole('alert')).toContainText('明暗差');
  await expect(page.getByRole('button', { name: 'PNGを保存' })).toBeDisabled();
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await page.getByRole('textbox', { name: 'URL・テキスト' }).fill('日'.repeat(501));
  await expect(page.getByRole('alert')).toContainText('1,500');
});

for (const slug of [
  'image-format-converter',
  'image-resizer',
  'screenshot-decorator',
  'favicon-maker',
  'ogp-image-maker',
]) {
  test(`${slug} rejects unsafe files and recovers without stale output`, async ({ page }) => {
    await page.goto(`/tools/${slug}`);
    if (slug === 'favicon-maker')
      await page.getByRole('radio', { name: '画像', exact: true }).check();
    const file = page.locator('input[type=file]').first();
    for (const mime of ['image/png', 'image/jpeg', 'image/webp']) {
      await file.setInputFiles(await imageFile(page, mime));
      await expect(preview(page)).toBeVisible();
      await expect(page.getByRole('alert')).toHaveCount(0);
    }
    for (const sample of [
      { name: 'wrong.svg', buffer: Buffer.from('<svg/>') },
      { name: 'empty.png', buffer: Buffer.alloc(0) },
      { name: 'fake.png', buffer: Buffer.from('<script>bad</script>') },
      { name: 'broken.png', buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]) },
    ]) {
      await file.setInputFiles({ ...sample, mimeType: 'image/png' });
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(
        page.getByRole('button', {
          name: slug === 'favicon-maker' ? '一式をZIPで保存' : 'PNGを保存',
          exact: true,
        }),
      ).toBeDisabled();
    }
    await page.getByRole('button', { name: 'リセット', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}

test('large headers and files are bounded; resetting while reading discards the old image', async ({
  page,
}) => {
  await page.goto('/tools/image-format-converter');
  const file = page.locator('input[type=file]');
  const header = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(header);
  header.writeUInt32BE(8193, 16);
  header.writeUInt32BE(2, 20);
  await file.setInputFiles({ name: 'oversize.png', mimeType: 'image/png', buffer: header });
  await expect(page.getByRole('alert')).toContainText('8,192');
  await file.setInputFiles({
    name: 'large.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await expect(page.getByRole('alert')).toContainText('バイト');
  const valid = await imageFile(page);
  await page.evaluate(() => {
    const read = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = async function () {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return read.call(this);
    };
  });
  await file.setInputFiles(valid);
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await page.waitForTimeout(350);
  await expect(preview(page)).toHaveCount(0);
});

test('new tools handle unavailable Canvas/clipboard APIs and isolate state across routes', async ({
  page,
}) => {
  await page.goto('/tools/code-shot');
  await expect(preview(page)).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  });
  await page.getByRole('button', { name: '画像をコピー' }).click();
  await expect(
    page.getByText('画像コピーに未対応です。画像を保存してください。', { exact: true }),
  ).toBeVisible();
  await page.getByRole('textbox', { name: 'コード・テキスト' }).fill('private input');
  await page.getByRole('link', { name: 'ツール一覧に戻る' }).click();
  await expect(page.locator('.tool-card:not(.planned)')).toHaveCount(20);
  await page.getByRole('link', { name: /Code Shot/ }).click();
  await expect(page.getByRole('textbox', { name: 'コード・テキスト' })).not.toHaveValue(
    'private input',
  );
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key !== 'web-tools-box.theme'),
    ),
  ).toEqual([]);
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('画像処理');
  await expect(page.getByRole('button', { name: 'PNGを保存' })).toBeDisabled();
});
