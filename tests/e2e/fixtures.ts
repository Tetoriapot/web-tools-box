import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ runtimeGuard: void }>({
  runtimeGuard: [
    async ({ page }, use) => {
      const errors: string[] = [];
      const externalRequests: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('request', (request) => {
        const url = new URL(request.url());
        if ((url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== '127.0.0.1')
          externalRequests.push(request.url());
      });
      await use();
      expect(errors, 'No browser errors').toEqual([]);
      expect(externalRequests, 'No external requests, including submitted input').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
