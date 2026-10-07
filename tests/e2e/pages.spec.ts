import { expect, test } from './fixtures';
import { pagesServer } from './pages-server';
import { assertUsable } from './quality-helpers';

test('Pages subdirectory supports direct routes, assets, actions and scoped offline use', async ({
  page,
  context,
}, testInfo) => {
  test.setTimeout(180_000);
  const server = await pagesServer(testInfo.outputPath('site'));
  try {
    const initial = await page.goto(`${server.url}tools/url-encoder`);
    expect(initial?.status()).toBe(200);
    await expect(page.getByRole('textbox', { name: '変換するテキスト' })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'サンプル', exact: true }).click();
    await page.getByRole('button', { name: 'エンコードする' }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    expect((await download).suggestedFilename()).toBeTruthy();
    await page.getByRole('link', { name: 'ツール一覧に戻る' }).click();
    const paths = await page
      .locator('.tool-card')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')!));
    expect(paths).toHaveLength(20);
    for (const path of paths) {
      expect(path).toMatch(/^\/web-tools-box\/tools\//);
      // An HTTP check proves each route exists without help from a previously installed worker.
      const response = await page.request.get(new URL(path, server.url).href);
      expect(response.status(), path).toBe(200);
      expect(await response.text()).toContain('/web-tools-box/assets/');
    }
    const manifest = await (await page.request.get(`${server.url}manifest.webmanifest`)).json();
    expect(manifest.scope).toBe('/web-tools-box/');
    expect(manifest.start_url).toBe('/web-tools-box/');
    for (const icon of manifest.icons) expect(icon.src).toMatch(/^\/web-tools-box\/icons\//);
    expect((await page.request.get(`${server.url}missing-route`)).status()).toBe(404);
    await page.goto(`${server.url}about/`);
    await expect(page.getByText('オフラインで利用できます。', { exact: true })).toBeVisible();
    const cachePaths = await page.evaluate(async () => {
      const paths: string[] = [];
      for (const name of await caches.keys())
        for (const request of await (await caches.open(name)).keys())
          paths.push(new URL(request.url).pathname);
      return paths;
    });
    expect(cachePaths.every((path) => path.startsWith('/web-tools-box/'))).toBe(true);
    expect(
      await page.evaluate(
        async () => new URL((await navigator.serviceWorker.ready).scope).pathname,
      ),
    ).toBe('/web-tools-box/');
    await context.setOffline(true);
    await page.goto(`${server.url}tools/image-resizer/`);
    await page.getByRole('button', { name: 'サンプル', exact: true }).click();
    const image = page.getByRole('img', { name: '出力画像のプレビュー', exact: true });
    await expect(image).toBeVisible();
    const png = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PNGを保存' }).click();
    expect((await png).suggestedFilename()).toBe('resized.png');
    await page.getByRole('button', { name: 'リセット', exact: true }).click();
    await page.getByRole('button', { name: '元に戻す' }).click();
    await expect(image).toBeVisible();
    for (const theme of ['light', 'dark'] as const) {
      if ((await page.locator('html').getAttribute('data-theme')) !== theme)
        await page.getByRole('button', { name: /モードに切り替える/ }).click();
      await assertUsable(page, `Pages-${theme}`);
      await page.screenshot({ path: testInfo.outputPath(`pages-${theme}.png`), fullPage: true });
    }
  } finally {
    await context.setOffline(false);
    await server.close();
  }
});
