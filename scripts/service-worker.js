// Replaced by scripts/pwa.ts after Vite writes a complete production build.
const {
  cacheName,
  assets,
  basePath = '/',
  cachePrefix = 'web-tools-box-static-',
} = self.__WEB_TOOLS_PRECACHE__;
const paths = new Set(assets.map((asset) => asset.url));

function precache(cache) {
  return cache.addAll(
    assets.map(
      ({ url, integrity }) => new Request(url, { cache: 'reload', credentials: 'omit', integrity }),
    ),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(cacheName);
        // Integrity rejects stale public files, mixed deployments, and HTML fallbacks for JS.
        // addAll commits only when the entire batch succeeds; never cache user requests.
        await precache(cache);
      } catch (error) {
        await caches.delete(cacheName);
        throw error;
      }
    })(),
  );
  // Do not skipWaiting: a new version must not interrupt an open tool or another tab.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Natural activation means no old controlled pages still need these chunks.
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) =>
              name !== cacheName &&
              (name.startsWith(cachePrefix) ||
                (basePath === '/' && /^web-tools-box-static-[a-f0-9]{20}$/.test(name))),
          )
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(basePath)
  )
    return;
  const relativePath = url.pathname.slice(basePath.length);
  const navigation =
    request.mode === 'navigate' &&
    !paths.has(url.pathname) &&
    !/^(?:assets|icons)\//.test(relativePath) &&
    !/\/[^/]*\.[^/]+$/.test(url.pathname);
  // Navigations share one shell; route/query strings are never written into a cache.
  // Static requests must exactly match a build asset, without a query or Range header.
  if (!navigation && (url.search || !paths.has(url.pathname) || request.headers.has('range')))
    return;
  event.respondWith(
    (async () => {
      try {
        const cache = await caches.open(cacheName);
        const cached = await cache.match(navigation ? `${basePath}index.html` : url.pathname);
        if (cached) return cached;
      } catch {
        // A browser can revoke storage access after installation. Online use still works.
      }
      return fetch(request);
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'OFFLINE_STATUS' || !event.ports[0]) return;
  const port = event.ports[0];
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(cacheName);
        const stored = new Set(
          (await cache.keys()).map((request) => new URL(request.url).pathname),
        );
        // Recover evicted static assets when online. A failed repair leaves existing entries intact.
        if (!assets.every(({ url }) => stored.has(url))) await precache(cache);
        port.postMessage({ ready: true });
      } catch {
        port.postMessage({ ready: false });
      } finally {
        port.close();
      }
    })(),
  );
});
