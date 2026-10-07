import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';

// Match Pages directory redirects and real 404s instead of Vite's SPA fallback.
export async function pagesServer(output: string) {
  const base = '/web-tools-box/';
  await build({ base, build: { outDir: output }, logLevel: 'silent' });
  const names = (await readdir(output, { recursive: true }))
    .map((name) => name.replaceAll('\\', '/'))
    .filter((name) => /\.(?:html|js|css|svg|png|webmanifest)$/.test(name));
  const files = new Map<string, Buffer>(
    await Promise.all(
      names.map(async (name) => [`${base}${name}`, await readFile(resolve(output, name))] as const),
    ),
  );
  const server = createServer((request, response) => {
    const url = new URL(request.url!, 'http://127.0.0.1');
    const path = url.pathname;
    const index = `${path}${path.endsWith('/') ? '' : '/'}index.html`;
    if (!path.endsWith('/') && files.has(index)) {
      response.writeHead(301, { Location: `${path}/${url.search}` });
      response.end();
      return;
    }
    const content = files.get(path) ?? (path.endsWith('/') ? files.get(index) : undefined);
    const extension = path.split('.').pop()!;
    const types: Record<string, string> = {
      js: 'text/javascript',
      css: 'text/css',
      svg: 'image/svg+xml',
      png: 'image/png',
      webmanifest: 'application/manifest+json',
    };
    response.writeHead(content ? 200 : 404, {
      'Content-Type': types[extension] ?? 'text/html',
      'Cache-Control': 'no-cache',
    });
    response.end(content ?? files.get(`${base}404.html`));
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server has no address');
  return {
    url: `http://127.0.0.1:${address.port}${base}`,
    async close() {
      server.closeAllConnections();
      await new Promise<void>((done, reject) =>
        server.close((error) => (error ? reject(error) : done())),
      );
    },
  };
}
