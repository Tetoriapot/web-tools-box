import type { Locator, Page } from '@playwright/test';
import { toolSlugs } from './quality-helpers';
import { expect, test } from './fixtures';

async function tabTo(page: Page, target: Locator, backwards = false) {
  for (let i = 0; i < 160; i++) {
    if (await target.evaluate((node) => node === document.activeElement)) {
      await expect(target).toBeInViewport();
      const outline = await target.evaluate((node) => getComputedStyle(node).outlineWidth);
      expect(parseFloat(outline)).toBeGreaterThanOrEqual(2);
      return;
    }
    await page.keyboard.press(backwards ? 'Shift+Tab' : 'Tab');
  }
  throw new Error(`Keyboard cannot reach ${await target.textContent()}`);
}

test('all twenty tools support a keyboard-only sample, action, reset and return workflow', async ({
  page,
  context,
}) => {
  test.setTimeout(180_000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  for (const slug of await toolSlugs(page)) {
    await page.goto(`/tools/${slug}`);
    await expect(page.locator('.workspace')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'メインコンテンツへ移動' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    await tabTo(page, page.getByRole('button', { name: 'サンプル', exact: true }));
    await page.keyboard.press('Enter');
    const action = page.getByRole('button', {
      name: /^(UUIDを生成|エンコードする|検証して表示|YAMLに変換)$/,
    });
    if (await action.count()) {
      await tabTo(page, action, true);
      await page.keyboard.press('Enter');
    }
    const outputAction = page
      .locator('.workspace-result button')
      .filter({ hasText: /コピー|保存/ })
      .first();
    await expect(outputAction).toBeEnabled();
    await tabTo(page, outputAction);
    if ((await outputAction.textContent())?.includes('保存')) {
      const event = page.waitForEvent('download', { timeout: 10000 });
      await page.keyboard.press('Enter');
      expect((await event).suggestedFilename()).toBeTruthy();
    } else {
      await page.keyboard.press('Enter');
      await expect(page.getByText('コピーしました', { exact: true })).toBeVisible();
    }
    await tabTo(page, page.getByRole('button', { name: 'リセット', exact: true }), true);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('alert')).toHaveCount(0);
    await tabTo(page, page.getByRole('link', { name: 'ツール一覧に戻る' }), true);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('main')).toBeFocused();
  }
});

test('number and file errors describe the matching field and clear on recovery', async ({
  page,
}) => {
  await page.goto('/tools/image-resizer');
  await page.getByRole('button', { name: 'サンプル', exact: true }).click();
  const width = page.getByRole('spinbutton', { name: '幅（px）', exact: true });
  await width.fill('1.5');
  await expect(width).toHaveAttribute('aria-invalid', 'true');
  await expect(width).toHaveAccessibleDescription('整数で入力してください。');
  expect(
    await width.evaluate((node) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--danger)';
      node.after(probe);
      const expected = getComputedStyle(probe).color;
      probe.remove();
      return getComputedStyle(node).borderTopColor === expected;
    }),
  ).toBe(true);
  await expect(page.getByRole('button', { name: 'PNGを保存' })).toBeDisabled();
  await width.fill('800');
  await expect(width).toHaveAttribute('aria-invalid', 'false');
  await expect(page.getByRole('button', { name: 'PNGを保存' })).toBeEnabled();
  await page.getByRole('radio', { name: '割合（%）' }).check();
  const percent = page.getByRole('spinbutton', { name: '元画像に対する倍率（%）' });
  await percent.fill('0.001');
  await expect(percent).toHaveAccessibleDescription(/0.01〜400/);
  await expect(page.getByRole('button', { name: 'PNGを保存' })).toBeDisabled();
  await percent.fill('50');
  await expect(page.getByRole('button', { name: 'PNGを保存' })).toBeEnabled();
  await page.goto('/tools/ogp-image-maker');
  const background = page
    .getByRole('group', { name: '背景画像（任意）' })
    .locator('input[type=file]');
  const logo = page.getByRole('group', { name: 'ロゴ（任意）' }).locator('input[type=file]');
  await logo.setInputFiles({
    name: 'bad.exe',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('bad'),
  });
  await expect(logo).toHaveAttribute('aria-invalid', 'true');
  await expect(logo).toHaveAccessibleDescription(/対応するファイル/);
  await expect(background).toHaveAttribute('aria-invalid', 'false');
  await page.getByRole('button', { name: 'ロゴを外す' }).click();
  await expect(logo).toHaveAttribute('aria-invalid', 'false');
  await expect(page.getByRole('button', { name: 'PNGを保存' })).toBeEnabled();
  await page.goto('/tools/json-visualizer');
  await page.getByRole('textbox', { name: 'JSON', exact: true }).fill('{');
  await page.getByRole('button', { name: '検証して表示' }).click();
  await expect(
    page.getByRole('textbox', { name: 'JSON', exact: true }),
  ).toHaveAccessibleDescription(/100,000文字.*JSONとして読み込めません|100,000文字.*行目/s);
});

test('oversized PNG, JPEG and WebP headers are rejected before native decoding', async ({
  page,
}) => {
  await page.goto('/tools/image-format-converter');
  await page.evaluate(() => {
    Reflect.set(window, 'createdImageUrls', 0);
    const create = URL.createObjectURL;
    URL.createObjectURL = (blob) => {
      Reflect.set(window, 'createdImageUrls', Number(Reflect.get(window, 'createdImageUrls')) + 1);
      return create(blob);
    };
  });
  for (const [extension, mime, hex] of [
    ['png', 'image/png', '89504e470d0a1a0a0000000d494844520000200100000001'],
    ['jpg', 'image/jpeg', 'ffd8ffc0000b080001200101011100'],
    ['webp', 'image/webp', '524946461600000057454250565038580a00000000000000002000000000'],
  ]) {
    await page.locator('input[type=file]').setInputFiles({
      name: `large.${extension}`,
      mimeType: mime!,
      buffer: Buffer.from(hex!, 'hex'),
    });
    await expect(page.getByRole('alert')).toContainText('8,192');
    await expect(page.getByRole('button', { name: 'PNGを保存' })).toBeDisabled();
  }
  expect(await page.evaluate(() => Reflect.get(window, 'createdImageUrls'))).toBe(0);
});

test('image Object URLs are released after load, failure, replacement, download and route exit', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    const live = new Set<string>(),
      create = URL.createObjectURL,
      revoke = URL.revokeObjectURL;
    Reflect.set(window, 'liveImageUrls', live);
    URL.createObjectURL = (blob) => {
      const url = create(blob);
      live.add(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      live.delete(url);
      revoke(url);
    };
  });
  const urls = () =>
    page.evaluate(() => [...(Reflect.get(window, 'liveImageUrls') as Set<string>)]);
  for (const slug of [
    'base64-converter',
    'image-format-converter',
    'image-resizer',
    'screenshot-decorator',
    'favicon-maker',
    'ogp-image-maker',
  ]) {
    await page.goto(`/tools/${slug}`);
    if (['base64-converter', 'favicon-maker'].includes(slug))
      await page.getByRole('radio', { name: '画像', exact: true }).check();
    const uri = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 32;
      canvas.getContext('2d')!.fillRect(0, 0, 32, 32);
      return canvas.toDataURL();
    });
    const file = page.locator('input[type=file]').first();
    const valid = {
      name: 'image.png',
      mimeType: 'image/png',
      buffer: Buffer.from(uri.split(',')[1]!, 'base64'),
    };
    for (let i = 0; i < 2; i++) {
      await file.setInputFiles(valid);
      await expect(
        page.getByRole('img', { name: /出力画像のプレビュー|Base64画像のプレビュー/, exact: true }),
      ).toBeVisible();
      await expect.poll(urls).toEqual([]);
    }
    const event = page.waitForEvent('download');
    await page
      .getByRole('button', {
        name:
          slug === 'base64-converter'
            ? '画像を保存'
            : slug === 'favicon-maker'
              ? '16px PNG'
              : 'PNGを保存',
        exact: true,
      })
      .click();
    await event;
    await expect.poll(urls).toEqual([]);
    await file.setInputFiles({
      name: 'broken.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    });
    await expect(page.getByRole('alert')).toBeVisible();
    await expect.poll(urls).toEqual([]);
    await page.evaluate(() => {
      const read = File.prototype.arrayBuffer;
      File.prototype.arrayBuffer = async function () {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return read.call(this);
      };
    });
    await file.setInputFiles(valid);
    await page.getByRole('link', { name: 'ツール一覧に戻る' }).click();
    await page.waitForTimeout(300);
    await expect.poll(urls).toEqual([]);
    await expect(page.locator('.tool-card')).toHaveCount(20);
  }
});
