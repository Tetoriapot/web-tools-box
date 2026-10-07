import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Reproducible raster assets from our existing vector icon. No remote images or new dependency.
const favicon = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const directory = new URL('../public/icons/', import.meta.url);
  await mkdir(directory, { recursive: true });
  for (const [name, size, maskable] of [
    ['icon-192', 192, false],
    ['icon-512', 512, false],
    ['maskable-512', 512, true],
    ['apple-touch-icon', 180, false],
  ]) {
    const data = await page.evaluate(
      async ({ favicon, size, maskable }) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas is unavailable.');
        context.fillStyle = '#19715d';
        context.fillRect(0, 0, size, size);
        const image = new Image();
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(favicon)}`;
        await image.decode();
        // Keep the complete glyph inside the maskable icon's central 80% safe circle.
        const padding = maskable ? size * 0.12 : 0;
        context.drawImage(image, padding, padding, size - padding * 2, size - padding * 2);
        return canvas.toDataURL('image/png').split(',')[1];
      },
      { favicon, size, maskable },
    );
    await writeFile(new URL(`${name}.png`, directory), Buffer.from(data, 'base64'));
  }
} finally {
  await browser.close();
}
