import { expect, test } from './fixtures';

test('search, categories, active tools and unknown routes', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.tool-card')).toHaveCount(20);
  await page.getByRole('searchbox', { name: 'ツールを検索' }).fill('UUID');
  await expect(page.locator('.tool-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'SVG・CSS', exact: true }).click();
  await expect(page.getByText('ツールが見つかりませんでした')).toBeVisible();
  await page.getByRole('button', { name: '絞り込みをリセット' }).click();
  await expect(page.locator('.tool-card')).toHaveCount(20);
  await page.getByRole('link', { name: /Screenshot Decorator/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Screenshot Decorator', exact: true }),
  ).toBeVisible();
  await page.goto('/tools/not-a-tool');
  await expect(page.getByRole('heading', { name: 'ページが見つかりません' })).toBeVisible();
});

test('theme respects OS, persists choice, and supports keyboard navigation', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'ライトモードに切り替える' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'メインコンテンツへ移動' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});
