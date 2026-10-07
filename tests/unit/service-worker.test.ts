// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync('scripts/service-worker.js', 'utf8');
function worker(basePath = '/') {
  const cachePrefix = basePath === '/' ? 'web-tools-box-static-' : 'web-tools-box-static-project-';
  const remove = vi.fn(async () => true);
  const handlers = new Map<string, (event: unknown) => void>();
  const match = vi.fn(async (): Promise<Response | undefined> => new Response('cached'));
  const open = vi.fn(async () => ({ match }));
  const fetch = vi.fn(async () => new Response('network'));
  runInNewContext(source, {
    self: {
      __WEB_TOOLS_PRECACHE__: {
        cacheName: `${cachePrefix}current`,
        cachePrefix,
        basePath,
        assets: ['index.html', 'assets/tool.js', 'icons/icon.png'].map((name) => ({
          url: `${basePath}${name}`,
        })),
      },
      clients: { claim: vi.fn() },
      location: { origin: 'https://tool.test' },
      addEventListener: (type: string, handler: (event: unknown) => void) =>
        handlers.set(type, handler),
    },
    URL,
    caches: {
      open,
      delete: remove,
      keys: async () => [
        `${cachePrefix}old`,
        `${cachePrefix}current`,
        'web-tools-box-static-other-old',
        'unrelated',
        'web-tools-box-static-deadbeef0123456789ab',
      ],
    },
    fetch,
  });
  const dispatch = (
    url: string,
    options: { method?: string; mode?: string; range?: string } = {},
  ) => {
    const respondWith = vi.fn();
    const request = {
      url: new URL(url, 'https://tool.test').href,
      method: options.method ?? 'GET',
      mode: options.mode ?? 'cors',
      headers: new Headers(options.range ? { range: options.range } : {}),
    };
    handlers.get('fetch')!({ request, respondWith });
    return { request, respondWith };
  };
  return { dispatch, match, open, fetch, handlers, remove };
}

describe('static-only offline responses', () => {
  it('serves project routes without intercepting neighboring sites', async () => {
    const { dispatch, match } = worker('/web-tools-box/');
    const route = dispatch('/web-tools-box/tools/uuid-generator?private=input', {
      mode: 'navigate',
    });
    await route.respondWith.mock.calls[0]![0];
    expect(match).toHaveBeenCalledWith('/web-tools-box/index.html');
    for (const url of [
      '/another-site/',
      '/web-tools-box-other/',
      '/web-tools-box/assets/missing.js',
    ]) {
      expect(dispatch(url, { mode: 'navigate' }).respondWith).not.toHaveBeenCalled();
    }
  });
  it('removes only the old caches for its own deployment path', async () => {
    const { handlers, remove } = worker('/web-tools-box/');
    let completion: Promise<void> | undefined;
    handlers.get('activate')!({
      waitUntil: (promise: Promise<void>) => {
        completion = promise;
      },
    });
    await completion;
    expect(remove).toHaveBeenCalledExactlyOnceWith('web-tools-box-static-project-old');
  });
  it.each([
    { url: 'https://outside.test/assets/tool.js' },
    { url: '/assets/tool.js', method: 'POST' },
    { url: '/assets/tool.js?private=input' },
    { url: '/assets/tool.js', range: 'bytes=0-10' },
    { url: '/not-built.json' },
    { url: '/assets/missing.js', mode: 'navigate' },
    { url: 'blob:https://tool.test/input' },
    { url: 'data:text/plain,input' },
  ])('does not intercept $url $method $range', ({ url, ...options }) => {
    const { dispatch, open, fetch } = worker();
    expect(dispatch(url, options).respondWith).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('serves a route from the same shell without passing its query to storage', async () => {
    const { dispatch, match, fetch } = worker();
    const result = dispatch('/tools/url-encoder?private=input', { mode: 'navigate' });
    const response: Response = await result.respondWith.mock.calls[0]![0];
    expect(await response.text()).toBe('cached');
    expect(match).toHaveBeenCalledWith('/index.html');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('serves an icon directly even when opened as a navigation', async () => {
    const { dispatch, match } = worker();
    const result = dispatch('/icons/icon.png', { mode: 'navigate' });
    await result.respondWith.mock.calls[0]![0];
    expect(match).toHaveBeenCalledWith('/icons/icon.png');
  });
  it.each(['missing', 'denied'] as const)(
    'falls back online when the cache is %s',
    async (reason) => {
      const { dispatch, match, open, fetch } = worker();
      if (reason === 'missing') match.mockResolvedValue(undefined);
      else open.mockRejectedValue(new Error('SecurityError'));
      const { request, respondWith } = dispatch('/assets/tool.js');
      const response: Response = await respondWith.mock.calls[0]![0];
      expect(await response.text()).toBe('network');
      expect(fetch).toHaveBeenCalledWith(request);
    },
  );
});
