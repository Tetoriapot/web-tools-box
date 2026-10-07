import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// A test-only static server allows real browser service worker updates. No app backend.
export async function pwaServer() {
  const root = resolve('dist');
  const names = (await readdir(root, { recursive: true }))
    .map((name) => name.replaceAll('\\', '/'))
    .filter((name) => /\.(html|js|css|svg|png|webmanifest)$/.test(name) && name !== 'sw.js');
  const files = new Map<string, Buffer>(
    await Promise.all(
      names.map(async (name) => [`/${name}`, await readFile(resolve(root, name))] as const),
    ),
  );
  const template = await readFile('scripts/service-worker.js', 'utf8');
  let version = 'one';
  let corrupt = false;
  const requests: string[] = [];
  const index = () =>
    Buffer.from(
      files
        .get('/index.html')!
        .toString()
        .replace('</head>', `<meta name="test-version" content="${version}" /></head>`),
    );
  const server = createServer((request, response) => {
    const path = new URL(request.url!, 'http://127.0.0.1').pathname;
    requests.push(`${request.method} ${request.url}`);
    response.setHeader('Cache-Control', 'no-store');
    if (path === '/sw.js') {
      const assets = [...files].map(([url, buffer]) => ({
        url,
        integrity: `sha256-${createHash('sha256')
          .update(url === '/index.html' ? index() : buffer)
          .digest('base64')}`,
      }));
      response.setHeader('Content-Type', 'text/javascript');
      response.end(
        template.replace(
          'self.__WEB_TOOLS_PRECACHE__',
          JSON.stringify({
            cacheName: `web-tools-box-static-e2e-${version}`,
            assets,
          }),
        ),
      );
      return;
    }
    const content = path === '/index.html' ? index() : files.get(path);
    if (content && request.method === 'GET') {
      const type = path.endsWith('.js')
        ? 'text/javascript'
        : path.endsWith('.css')
          ? 'text/css'
          : path.endsWith('.png')
            ? 'image/png'
            : path.endsWith('.svg')
              ? 'image/svg+xml'
              : path.endsWith('.webmanifest')
                ? 'application/manifest+json'
                : 'text/html';
      response.setHeader('Content-Type', type);
      response.end(corrupt && path.includes('jszip.min-') ? '<html>bad deploy</html>' : content);
    } else if (request.method === 'GET' && !/\.[^/]+$/.test(path)) {
      response.setHeader('Content-Type', 'text/html');
      response.end(index());
    } else {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test server address');
  return {
    origin: `http://127.0.0.1:${address.port}`,
    requests,
    deploy(next: string, broken = false) {
      version = next;
      corrupt = broken;
    },
    async close() {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}
