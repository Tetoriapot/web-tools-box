import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

const routes = [
  '/',
  '/tools/uuid-generator',
  '/tools/url-encoder',
  '/tools/text-case-converter',
  '/tools/gradient-maker',
  '/tools/box-shadow-maker',
  '/tools/border-radius-maker',
  '/tools/clamp-calculator',
  '/tools/svg-background-maker',
  '/tools/svg-shape-maker',
  '/tools/json-visualizer',
  '/tools/json-yaml-converter',
  '/tools/base64-converter',
  '/tools/markdown-preview',
  '/tools/screenshot-decorator',
  '/tools/code-shot',
  '/tools/favicon-maker',
  '/tools/ogp-image-maker',
  '/tools/qr-code-maker',
  '/tools/image-format-converter',
  '/tools/image-resizer',
];

for (const width of [360, 768, 1024, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${width}px ${theme}: all active screens fit and pass WCAG AA checks`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      for (const route of routes) {
        await page.goto(route);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        if (route !== '/') await expect(page.locator('.workspace')).toBeVisible();
        if (
          [
            '/tools/screenshot-decorator',
            '/tools/image-format-converter',
            '/tools/image-resizer',
          ].includes(route)
        )
          await page.getByRole('button', { name: 'サンプル', exact: true }).click();
        if (
          [
            '/tools/screenshot-decorator',
            '/tools/code-shot',
            '/tools/favicon-maker',
            '/tools/ogp-image-maker',
            '/tools/qr-code-maker',
            '/tools/image-format-converter',
            '/tools/image-resizer',
          ].includes(route)
        )
          await expect(
            page.getByRole('img', { name: '出力画像のプレビュー', exact: true }),
          ).toBeVisible();
        if (
          [
            '/tools/json-visualizer',
            '/tools/json-yaml-converter',
            '/tools/base64-converter',
            '/tools/markdown-preview',
          ].includes(route)
        ) {
          await page.getByRole('button', { name: 'サンプル', exact: true }).click();
          if (route === '/tools/json-visualizer')
            await page.getByRole('button', { name: '検証して表示' }).click();
          if (route === '/tools/json-yaml-converter')
            await page.getByRole('button', { name: 'YAMLに変換' }).click();
          if (route === '/tools/base64-converter')
            await page.getByRole('button', { name: 'エンコードする' }).click();
          if (route === '/tools/markdown-preview')
            await expect(page.getByRole('article')).toBeVisible();
        }
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          route,
        ).toBe(true);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        expect(
          results.violations.map((violation) => ({
            id: violation.id,
            nodes: violation.nodes.map((node) => ({
              target: node.target,
              summary: node.failureSummary,
            })),
          })),
          `${route}: ${JSON.stringify(results.violations.map((violation) => ({ id: violation.id, nodes: violation.nodes.map((node) => node.target) })))}`,
        ).toEqual([]);
        const name = route.split('/').pop() || 'home';
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: testInfo.outputPath(`${name}-${width}-${theme}.png`),
          fullPage: route !== '/',
        });
      }
    });
  }
}
