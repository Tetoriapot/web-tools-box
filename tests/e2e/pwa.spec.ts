import { readFile, readdir } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { assertUsable, runConversion, toolSlugs } from './quality-helpers';
import { pwaServer } from './pwa-server';

const readyText = 'オフラインで利用できます。';
async function ready(page: Page, url = '/about') {
  await page.goto(url);
  await expect(page.getByRole('status')).toHaveText(readyText, { timeout: 20_000 });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
}
async function cacheNames(page: Page) {
  return page.evaluate(async () =>
    (await caches.keys()).filter((name) => name.startsWith('web-tools-box-static-')),
  );
}
async function update(page: Page) {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const result = new Promise<string>((resolve) => {
      registration.addEventListener(
        'updatefound',
        () => {
          const worker = registration.installing!;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' || worker.state === 'redundant') resolve(worker.state);
          });
        },
        { once: true },
      );
    });
    await registration.update();
    return result;
  });
}

test('manifest and real PNG icons describe an optional standalone Japanese app', async ({
  page,
}) => {
  await ready(page);
  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel=manifest]')!;
    return (await fetch(link.href)).json() as Promise<{
      id: string;
      start_url: string;
      scope: string;
      display: string;
      lang: string;
      icons: { src: string; sizes: string; purpose: string }[];
    }>;
  });
  expect(manifest).toMatchObject({
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    lang: 'ja',
  });
  expect(manifest.icons.map((icon) => [icon.sizes, icon.purpose])).toEqual([
    ['192x192', 'any'],
    ['512x512', 'any'],
    ['512x512', 'maskable'],
  ]);
  for (const icon of [
    ...manifest.icons,
    { src: '/icons/apple-touch-icon.png', sizes: '180x180' },
  ]) {
    const dimensions = await page.evaluate(async (src) => {
      const image = await createImageBitmap(await (await fetch(src)).blob());
      const size = `${image.width}x${image.height}`;
      image.close();
      return size;
    }, icon.src);
    expect(dimensions).toBe(icon.sizes);
  }
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.reload();
    await expect(page.getByRole('status')).toHaveText(readyText);
    await assertUsable(page, `PWA about ${theme}`);
  }
});

test('a first visit prepares all twenty tools for offline deep links, actions and reset', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const slugs = await toolSlugs(page);
  await ready(page);
  await context.setOffline(true);
  for (const slug of slugs) {
    await page.goto(`/tools/${slug}`);
    await expect(page.locator('.workspace')).toBeVisible();
    await page.getByRole('button', { name: 'サンプル', exact: true }).click();
    await runConversion(page);
    const action = page
      .locator('.workspace-result button')
      .filter({ hasText: /コピー|保存/ })
      .first();
    await expect(action).toBeEnabled();
    if ((await action.textContent())?.includes('保存')) {
      const download = page.waitForEvent('download');
      await action.click();
      expect((await readFile((await (await download).path())!)).length).toBeGreaterThan(0);
    } else {
      await action.click();
      await expect(page.getByText('コピーしました', { exact: true })).toBeVisible();
    }
    // JSZip is dynamically imported only on this action; it must already be cached too.
    if (slug === 'favicon-maker') {
      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: /ZIP.*保存/ }).click();
      expect((await download).suggestedFilename()).toMatch(/\.zip$/);
    }
    await page.getByRole('button', { name: 'リセット', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
  }
  await page.goto('/tools/not-a-tool');
  await expect(page.getByRole('heading', { name: 'ページが見つかりません' })).toBeVisible();
  await page.goto('/');
  await expect(page.locator('.tool-card')).toHaveCount(20);
  await page.reload();
  await expect(page.locator('.tool-card')).toHaveCount(20);
});

test('only exact build files are cached; input, file data and route queries are not persisted', async ({
  page,
}) => {
  await ready(page);
  const sentinel = 'PRIVATE-PWA-input-298175';
  await page.goto('/tools/json-visualizer?private=route-marker-4298');
  await page.locator('input[type=file]').setInputFiles({
    name: 'private.json',
    mimeType: 'application/json',
    buffer: Buffer.from(`{"secret":"${sentinel}"}`),
  });
  await page.getByRole('button', { name: '検証して表示' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.evaluate(async () => {
    await fetch('/favicon.svg?ignored=query-marker-3985');
  });
  const stored = await page.evaluate(async (sentinel) => {
    const entries: string[] = [];
    let leaked = false;
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        entries.push(new URL(request.url).pathname + new URL(request.url).search);
        const bytes = await (await cache.match(request))!.text();
        leaked ||=
          bytes.includes(sentinel) ||
          bytes.includes('route-marker-4298') ||
          bytes.includes('query-marker-3985');
      }
    }
    return {
      entries: entries.sort(),
      leaked,
      local: { ...localStorage },
      session: { ...sessionStorage },
      databases: await indexedDB.databases(),
    };
  }, sentinel);
  const expected = (await readdir('dist', { recursive: true }))
    .map((name) => name.replaceAll('\\', '/'))
    .filter((name) => /\.(?:html|js|css|svg|png|webmanifest)$/.test(name) && name !== 'sw.js')
    .map((name) => `/${name}`)
    .sort();
  expect(stored.entries).toEqual(expected);
  expect(stored.leaked).toBe(false);
  expect(Object.keys(stored.local).filter((key) => key !== 'web-tools-box.theme')).toEqual([]);
  expect(stored.session).toEqual({});
  expect(stored.databases).toEqual([]);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'JSON', exact: true })).toHaveValue('');
});

test('evicted static assets are restored without storing tool inputs', async ({ page }) => {
  await ready(page);
  const removed = await page.evaluate(async () => {
    const name = (await caches.keys()).find((name) => name.startsWith('web-tools-box-static-'))!;
    const cache = await caches.open(name);
    const file = (await cache.keys()).find((request) => request.url.includes('jszip.min-'))!;
    await cache.delete(file);
    return file.url;
  });
  await page.reload();
  await expect(page.getByRole('status')).toHaveText(readyText);
  expect(await page.evaluate(async (url) => !!(await caches.match(url)), removed)).toBe(true);
});

for (const failure of ['unsupported', 'denied'] as const) {
  test(`tools remain usable when service workers are ${failure}`, async ({ page }) => {
    await page.addInitScript((failure) => {
      if (failure === 'unsupported') Reflect.deleteProperty(Navigator.prototype, 'serviceWorker');
      else
        Object.defineProperty(navigator, 'serviceWorker', {
          value: {
            register: () => Promise.reject(new Error('storage denied')),
          },
        });
    }, failure);
    await page.goto('/about');
    await expect(page.getByRole('status')).toContainText(
      failure === 'unsupported' ? 'この環境では' : '準備ができていません',
    );
    await assertUsable(page, failure);
    await page.goto('/tools/uuid-generator');
    await page.getByRole('button', { name: 'UUIDを生成' }).click();
    await expect(
      page.locator('.workspace-result button').filter({ hasText: 'コピー' }).first(),
    ).toBeEnabled();
  });
}

test('a broken update keeps the old offline app; a complete update waits for every tab to close', async ({
  page,
  context,
}) => {
  test.setTimeout(90_000);
  const server = await pwaServer();
  try {
    await ready(page, `${server.origin}/about`);
    expect(await cacheNames(page)).toEqual(['web-tools-box-static-e2e-one']);
    const second = await context.newPage();
    await second.goto(`${server.origin}/tools/url-encoder`);
    const input = second.locator('textarea').first();
    await input.fill('入力中の内容 / stay unchanged');
    await page.evaluate(async () => {
      await caches.open('unrelated-site-cache');
    });

    server.deploy('broken', true);
    expect(await update(page)).toBe('redundant');
    await expect.poll(() => cacheNames(page)).toEqual(['web-tools-box-static-e2e-one']);
    await expect(input).toHaveValue('入力中の内容 / stay unchanged');

    server.deploy('two');
    expect(await update(page)).toBe('installed');
    const workers = await Promise.all(
      context
        .serviceWorkers()
        .map(async (worker) => ({ worker, name: await worker.evaluate('cacheName') })),
    );
    const nextWorker = workers.find(({ name }) => name === 'web-tools-box-static-e2e-two')!.worker;
    await expect(page.getByRole('status')).toContainText('新しいバージョン');
    await expect(input).toHaveValue('入力中の内容 / stay unchanged');
    await expect(second.locator('meta[name=test-version]')).toHaveAttribute('content', 'one');
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('meta[name=test-version]')).toHaveAttribute('content', 'one');
    await expect(page.getByRole('status')).toContainText('新しいバージョン');
    await page.goto(`${server.origin}/tools/markdown-preview`);
    await page.getByRole('button', { name: 'サンプル', exact: true }).click();
    await expect(page.locator('.workspace-result')).toBeVisible();
    // One old tab remains, so navigating the other away cannot activate the update.
    await page.goto('about:blank');
    expect(await second.evaluate(async () => !!(await navigator.serviceWorker.ready).waiting)).toBe(
      true,
    );
    await expect(input).toHaveValue('入力中の内容 / stay unchanged');
    await second.close();
    await expect
      .poll(() => nextWorker.evaluate(async () => (await caches.keys()).sort()))
      .toEqual(['unrelated-site-cache', 'web-tools-box-static-e2e-two']);
    await page.goto(`${server.origin}/about`);
    await expect(page.locator('meta[name=test-version]')).toHaveAttribute('content', 'two');
    await expect(page.getByRole('status')).toHaveText(readyText);
    expect(server.requests.every((request) => request.startsWith('GET '))).toBe(true);
    expect(server.requests.some((request) => request.includes('stay'))).toBe(false);
  } finally {
    await server.close();
  }
});

test('an incomplete first install stays online and retries after the deployment is fixed', async ({
  page,
}) => {
  const server = await pwaServer();
  try {
    server.deploy('broken', true);
    await page.goto(`${server.origin}/about`);
    await expect(page.getByRole('status')).toContainText('準備ができていません');
    expect(await cacheNames(page)).toEqual([]);
    await page.goto(`${server.origin}/tools/uuid-generator`);
    await page.getByRole('button', { name: 'UUIDを生成' }).click();
    await expect(
      page.locator('.workspace-result button').filter({ hasText: 'コピー' }).first(),
    ).toBeEnabled();
    server.deploy('fixed');
    await ready(page, `${server.origin}/about`);
    expect(await cacheNames(page)).toEqual(['web-tools-box-static-e2e-fixed']);
  } finally {
    await server.close();
  }
});
