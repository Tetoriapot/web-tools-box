import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { writeStaticRoutes } from './static-routes';

// Build output is the source of truth, including every lazy tool/library chunk.
export function offlineBuild(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'web-tools-offline',
    apply: 'build',
    enforce: 'post',
    configResolved(resolved) {
      config = resolved;
      if (
        !/^\/(?:[A-Za-z0-9._-]+\/)*$/.test(config.base) ||
        config.base.split('/').some((part) => part === '.' || part === '..')
      )
        throw new Error('The deployment base must be an absolute URL path ending in /.');
    },
    async closeBundle() {
      const output = resolve(config.root, config.build.outDir);
      const basePath = config.base;
      if (basePath !== '/') {
        const manifestPath = resolve(output, 'manifest.webmanifest');
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
        for (const key of ['id', 'start_url', 'scope']) manifest[key] = basePath;
        manifest.icons = manifest.icons.map((icon: { src: string }) => ({
          ...icon,
          src: `${basePath}${icon.src.replace(/^\//, '')}`,
        }));
        await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      }
      await writeStaticRoutes(config.root, output);
      const template = await readFile(resolve(config.root, 'scripts/service-worker.js'), 'utf8');
      const names = (await readdir(output, { recursive: true }))
        .map((name) => name.replaceAll('\\', '/'))
        .filter((name) => /\.(?:html|js|css|svg|png|webmanifest)$/.test(name) && name !== 'sw.js')
        .sort();
      const assets = await Promise.all(
        names.map(async (name) => ({
          url: `${basePath}${name}`,
          integrity: `sha256-${createHash('sha256')
            .update(await readFile(resolve(output, name)))
            .digest('base64')}`,
        })),
      );
      if (!names.includes('index.html') || !names.includes('manifest.webmanifest'))
        throw new Error('Offline build is missing the app shell or manifest.');
      const revision = createHash('sha256')
        .update(template)
        .update(JSON.stringify(assets))
        .digest('hex')
        .slice(0, 20);
      const cachePrefix = `web-tools-box-static-${createHash('sha256').update(basePath).digest('hex').slice(0, 12)}-`;
      const source = template.replace(
        'self.__WEB_TOOLS_PRECACHE__',
        JSON.stringify({ cacheName: `${cachePrefix}${revision}`, cachePrefix, basePath, assets }),
      );
      await writeFile(resolve(output, 'sw.js'), source);
    },
  };
}
