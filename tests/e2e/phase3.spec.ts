import { readFile } from 'node:fs/promises';
import { expect, test } from './fixtures';

test('radius links all corners, edits independently, randomizes and resets', async ({ page }) => {
  await page.goto('/tools/border-radius-maker');
  const css = page.getByRole('textbox', { name: '生成されたCSS' });
  const slider = page.getByRole('slider', { name: '左上・横', exact: true });
  await expect(page.getByRole('slider')).toHaveCount(8);
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(css).toHaveValue('border-radius: 26% 26% 26% 26% / 26% 26% 26% 26%;');
  await page.getByRole('checkbox', { name: '8つの値を連動させる' }).uncheck();
  await page.getByRole('slider', { name: '右下・縦', exact: true }).focus();
  await page.keyboard.press('Home');
  await expect(css).toHaveValue('border-radius: 26% 26% 26% 26% / 26% 26% 0% 26%;');
  await page.getByRole('button', { name: 'ランダムな形にする' }).click();
  await expect(page.getByRole('checkbox', { name: '8つの値を連動させる' })).not.toBeChecked();
  expect(
    await page
      .getByRole('img', { name: '角丸のプレビュー' })
      .evaluate((element) => getComputedStyle(element).borderTopLeftRadius),
  ).not.toBe('0px');
  const bounds = await page.getByRole('img', { name: '角丸のプレビュー' }).evaluate((element) => {
    const shape = element.getBoundingClientRect();
    const stage = element.parentElement!;
    const frame = stage.getBoundingClientRect();
    const padding = getComputedStyle(stage);
    return {
      left: shape.left,
      right: shape.right,
      min: frame.left + parseFloat(padding.paddingLeft),
      max: frame.right - parseFloat(padding.paddingRight),
    };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(bounds.min);
  expect(bounds.right).toBeLessThanOrEqual(bounds.max);
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await expect(css).toHaveValue('border-radius: 35% 65% 70% 30% / 55% 35% 65% 45%;');
  await page.getByRole('checkbox', { name: '8つの値を連動させる' }).check();
  await expect(css).toHaveValue('border-radius: 35% 35% 35% 35% / 35% 35% 35% 35%;');
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(css).toHaveValue('border-radius: 25% 25% 25% 25% / 25% 25% 25% 25%;');
});

test('clamp checks invalid bounds and matches the browser-computed font size', async ({ page }) => {
  await page.goto('/tools/clamp-calculator');
  const css = page.getByRole('textbox', { name: '生成されたCSS' });
  const minimum = page.getByRole('spinbutton', { name: '最小サイズ（px）', exact: true });
  for (const value of ['', '-1', '1001']) {
    await minimum.fill(value);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'CSSをコピー' })).toBeDisabled();
    await expect(css).toHaveValue('');
  }
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await page.getByRole('spinbutton', { name: '最大画面幅（px）', exact: true }).fill('360');
  await expect(page.getByRole('alert')).toContainText('大きく');
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  const declaration = await css.inputValue();
  const computed = await page.evaluate((style) => {
    const sample = document.createElement('div');
    sample.style.cssText = style;
    document.body.append(sample);
    const size = parseFloat(getComputedStyle(sample).fontSize);
    sample.remove();
    return { size, width: window.innerWidth };
  }, declaration);
  const expected = Math.min(48, Math.max(20, 20 + ((computed.width - 360) * 28) / 1080));
  expect(computed.size).toBeCloseTo(expected, 3);
  await page.getByRole('slider', { name: '確認する画面幅' }).focus();
  await page.keyboard.press('Home');
  await expect(page.getByRole('status', { name: '計算されたサイズ' })).toHaveText('20 px');
  await page.keyboard.press('End');
  await expect(page.getByRole('status', { name: '計算されたサイズ' })).toHaveText('48 px');
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(minimum).toHaveValue('16');
  await expect(css).toHaveValue('font-size: clamp(16px, calc(12px + 1.111111vw), 24px);');
});

test('background renders eight patterns and preserves transparent SVG across formats', async ({
  page,
}, testInfo) => {
  await page.goto('/tools/svg-background-maker');
  const output = page.getByRole('textbox', { name: '生成されたSVG' });
  const outputs = new Set<string>();
  for (const pattern of [
    'ドット',
    'グリッド',
    '縦ストライプ',
    '斜めストライプ',
    '市松模様',
    '三角形',
    '十字',
    '六角形',
  ]) {
    await page.getByRole('radio', { name: pattern, exact: true }).check();
    const svg = await output.inputValue();
    outputs.add(svg);
    const imageLoaded = await page.evaluate(async (text) => {
      const img = new Image();
      img.src = `data:image/svg+xml,${encodeURIComponent(text)}`;
      await img.decode();
      return img.naturalWidth > 0 && img.naturalHeight > 0;
    }, svg);
    expect(imageLoaded).toBe(true);
    await page
      .locator('.preview-panel')
      .screenshot({ path: testInfo.outputPath(`pattern-${pattern}.png`) });
  }
  expect(outputs.size).toBe(8);
  await page.getByRole('checkbox', { name: '背景を透明にする' }).check();
  expect(await output.inputValue()).not.toContain('<rect');
  const svg = await output.inputValue();
  await page.getByRole('radio', { name: 'Data URI', exact: true }).check();
  const uri = await page.getByRole('textbox', { name: '生成されたData URI' }).inputValue();
  expect(decodeURIComponent(uri.split(',')[1]!)).toBe(svg);
  await page.getByRole('radio', { name: 'CSS', exact: true }).check();
  await expect(page.getByRole('textbox', { name: '生成されたCSS' })).toHaveValue(
    `background-image: url("${uri}");\nbackground-repeat: repeat;\nbackground-size: 48px 27.712813px;`,
  );
  await page.getByRole('textbox', { name: '模様の色', exact: true }).fill('#nope');
  await expect(page.getByRole('alert')).toContainText('HEX');
  await expect(page.getByRole('button', { name: 'CSSをコピー' })).toBeDisabled();
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'SVG', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: '背景を透明にする' })).not.toBeChecked();
});

test('shape renders five families, reproduces seeds, flips and rejects invalid seeds', async ({
  page,
}) => {
  await page.goto('/tools/svg-shape-maker');
  const output = page.getByRole('textbox', { name: '生成されたSVG' });
  const preview = page.getByRole('img', { name: 'SVGシェイプのプレビュー' });
  const seed = page.getByRole('spinbutton', { name: 'Seed（形の番号）' });
  for (const kind of ['波 / Wave', '丸い形 / Blob', '山 / Mountain', '曲線 / Curve', 'ジグザグ']) {
    await page.getByRole('radio', { name: kind, exact: true }).check();
    await expect
      .poll(() =>
        preview.evaluate(
          (element) =>
            (element as HTMLImageElement).complete &&
            (element as HTMLImageElement).naturalWidth === 1200,
        ),
      )
      .toBe(true);
  }
  const before = await output.inputValue();
  await page.getByRole('button', { name: '次の形を試す' }).click();
  await expect(output).not.toHaveValue(before);
  await seed.fill('42');
  await expect(output).toHaveValue(before);
  await page.getByRole('checkbox', { name: '左右反転' }).check();
  await page.getByRole('checkbox', { name: '上下反転' }).check();
  await expect(output).toHaveValue(/translate\(1200 300\) scale\(-1 -1\)/);
  const flipped = await output.inputValue();
  await page.getByRole('button', { name: /モードに切り替える/ }).click();
  await expect(output).toHaveValue(flipped);
  for (const invalid of ['', '-1', '1.5', '4294967296']) {
    await seed.fill(invalid);
    await expect(page.getByRole('alert')).toContainText('Seed');
    await expect(page.getByRole('button', { name: 'SVGをコピー' })).toBeDisabled();
  }
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await expect(page.getByRole('radio', { name: '丸い形 / Blob' })).toBeChecked();
  await page.getByRole('button', { name: 'リセット', exact: true }).click();
  await expect(seed).toHaveValue('42');
  await expect(page.getByRole('radio', { name: '波 / Wave' })).toBeChecked();
});

for (const tool of [
  { slug: 'border-radius-maker', filename: 'border-radius.css', format: 'CSS' },
  { slug: 'clamp-calculator', filename: 'clamp.css', format: 'CSS' },
  { slug: 'svg-background-maker', filename: 'background.svg', format: 'SVG' },
  { slug: 'svg-shape-maker', filename: 'shape-blob.svg', format: 'SVG' },
]) {
  test(`${tool.slug} copies and downloads its exact sample`, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`/tools/${tool.slug}`);
    await page.getByRole('button', { name: 'サンプル', exact: true }).click();
    const expected = await page
      .getByRole('textbox', { name: `生成された${tool.format}` })
      .inputValue();
    expect(expected.length).toBeGreaterThan(0);
    await page.getByRole('button', { name: `${tool.format}をコピー` }).click();
    await expect(page.getByText('コピーしました', { exact: true })).toBeVisible();
    expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(
      expected,
    );
    const event = page.waitForEvent('download');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    const download = await event;
    expect(download.suggestedFilename()).toBe(tool.filename);
    expect(await readFile((await download.path())!, 'utf8')).toBe(expected);
  });
}

test('background downloads CSS and Data URI as selected', async ({ page }) => {
  await page.goto('/tools/svg-background-maker');
  for (const format of [
    { name: 'CSS', extension: 'css' },
    { name: 'Data URI', extension: 'txt' },
  ]) {
    await page.getByRole('radio', { name: format.name, exact: true }).check();
    const expected = await page
      .getByRole('textbox', { name: `生成された${format.name}` })
      .inputValue();
    const event = page.waitForEvent('download');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    const download = await event;
    expect(download.suggestedFilename()).toBe(`background.${format.extension}`);
    expect(await readFile((await download.path())!, 'utf8')).toBe(expected);
  }
});

test('new tools are ready in registry and release state between visits', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.tool-card:not(.planned)')).toHaveCount(20);
  await expect(page.locator('.tool-card.planned')).toHaveCount(0);
  await page.getByRole('link', { name: /SVG Shape Maker/ }).click();
  await page.getByRole('spinbutton', { name: 'Seed（形の番号）' }).fill('999');
  await page.getByRole('link', { name: 'ツール一覧に戻る' }).click();
  await page.getByRole('link', { name: /SVG Background Maker/ }).click();
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  await page.getByRole('link', { name: 'ツール一覧に戻る' }).click();
  await page.getByRole('link', { name: /SVG Shape Maker/ }).click();
  await expect(page.getByRole('spinbutton', { name: 'Seed（形の番号）' })).toHaveValue('42');
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((key) => key !== 'web-tools-box.theme'),
    ),
  ).toEqual([]);
});
