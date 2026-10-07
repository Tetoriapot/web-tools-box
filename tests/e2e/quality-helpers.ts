import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect } from './fixtures';

export async function toolSlugs(page: Page) {
  await page.goto('/');
  await expect(page.locator('.tool-card')).toHaveCount(20);
  return page
    .locator('.tool-card')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')!.split('/').pop()!));
}

export async function runConversion(page: Page) {
  const action = page.getByRole('button', {
    name: /^(UUIDを生成|エンコードする|デコードする|クエリを解析|検証して表示|YAMLに変換|JSONに変換)$/,
  });
  if (await action.count()) await action.click();
}

export async function assertUsable(page: Page, name: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name).toBe(
    true,
  );
  const shortTargets = await page.locator('a,button,input,select,textarea').evaluateAll((nodes) =>
    nodes.flatMap((node) => {
      if (
        node.matches(':disabled') ||
        node.closest('article') ||
        node.classList.contains('skip-link')
      )
        return [];
      const target = node.matches('input[type=radio],input[type=checkbox]')
        ? (node.closest('label') ?? node)
        : node;
      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height || getComputedStyle(node).visibility === 'hidden') return [];
      return rect.width < 43.9 || rect.height < 43.9
        ? [
            {
              name: node.getAttribute('aria-label') || node.textContent,
              width: rect.width,
              height: rect.height,
            },
          ]
        : [];
    }),
  );
  expect(shortTargets, `${name}: 44px targets`).toEqual([]);
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
    })),
    name,
  ).toEqual([]);
}
