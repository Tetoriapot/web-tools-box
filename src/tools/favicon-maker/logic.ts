import { canvasBlob, canvasContext, color, drawFitted, roundedRect } from '../../lib/canvas';
import { graphemes, sansFont } from '../../lib/canvas-text';

export const faviconSizes = [16, 32, 180, 192, 512] as const;
export type FaviconSettings = {
  text: string;
  foreground: string;
  background: string;
  transparent: boolean;
  radius: number;
  padding: number;
};
export const defaultFavicon: FaviconSettings = {
  text: 'W',
  foreground: '#ffffff',
  background: '#196b54',
  transparent: false,
  radius: 96,
  padding: 48,
};
export function renderFavicon(settings: FaviconSettings, source?: HTMLCanvasElement) {
  const { canvas, context } = canvasContext(512, 512);
  if (!settings.transparent) {
    context.fillStyle = color(settings.background);
    roundedRect(context, 0, 0, 512, 512, settings.radius);
    context.fill();
  }
  const available = 512 - settings.padding * 2;
  if (source) drawFitted(context, source, settings.padding, settings.padding, available, available);
  else {
    if (!settings.text.trim()) throw new Error('文字または絵文字を入力してください。');
    if (
      settings.text.length > 100 ||
      graphemes(settings.text).length > 4 ||
      /[\r\n]/.test(settings.text)
    )
      throw new Error('文字・絵文字は1行4文字までにしてください。');
    context.fillStyle = color(settings.foreground);
    let size = available * 0.8;
    context.font = `700 ${size}px ${sansFont}`;
    const measured = context.measureText(settings.text).width;
    if (measured > available) {
      size *= available / measured;
      context.font = `700 ${size}px ${sansFont}`;
    }
    const metrics = context.measureText(settings.text);
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.fillText(
      settings.text,
      256,
      256 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2,
    );
  }
  return canvas;
}
export function sizedIcon(source: HTMLCanvasElement, size: number) {
  const { canvas, context } = canvasContext(size, size);
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, size, size);
  return canvas;
}
export function icoFromPng(entries: { size: number; bytes: Uint8Array }[]) {
  if (
    !entries.length ||
    entries.length > 10 ||
    entries.some((entry) => !Number.isInteger(entry.size) || entry.size < 1 || entry.size > 256)
  )
    throw new Error('ICOに対応しないサイズです。');
  const offset = 6 + entries.length * 16;
  const bytes = new Uint8Array(
    offset + entries.reduce((sum, entry) => sum + entry.bytes.length, 0),
  );
  const view = new DataView(bytes.buffer);
  view.setUint16(2, 1, true);
  view.setUint16(4, entries.length, true);
  let position = offset;
  entries.forEach((entry, i) => {
    const header = 6 + i * 16;
    view.setUint8(header, entry.size === 256 ? 0 : entry.size);
    view.setUint8(header + 1, entry.size === 256 ? 0 : entry.size);
    view.setUint16(header + 4, 1, true);
    view.setUint16(header + 6, 32, true);
    view.setUint32(header + 8, entry.bytes.length, true);
    view.setUint32(header + 12, position, true);
    bytes.set(entry.bytes, position);
    position += entry.bytes.length;
  });
  return bytes;
}
export const faviconManifest = JSON.stringify(
  {
    name: 'Your website',
    short_name: 'Website',
    icons: [192, 512].map((size) => ({
      src: `/favicon-${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any',
    })),
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
  },
  null,
  2,
);
export const faviconHtml =
  '<link rel="icon" href="/favicon.ico" sizes="16x16 32x32">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">\n<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180.png">\n<link rel="manifest" href="/site.webmanifest">';
export async function faviconFiles(source: HTMLCanvasElement) {
  const images = await Promise.all(
    faviconSizes.map(async (size) => ({
      size,
      bytes: new Uint8Array(await (await canvasBlob(sizedIcon(source, size))).arrayBuffer()),
    })),
  );
  const files = new Map<string, Uint8Array>();
  for (const image of images) files.set(`favicon-${image.size}.png`, image.bytes);
  files.set('favicon.ico', icoFromPng(images.filter((image) => image.size <= 32)));
  files.set('site.webmanifest', new TextEncoder().encode(faviconManifest));
  files.set('head.html', new TextEncoder().encode(faviconHtml));
  files.set(
    'README.txt',
    new TextEncoder().encode(
      '画像とsite.webmanifestをサイトへ配置し、head.htmlのlink要素をheadに追加してください。manifestのサイト名・色・パスは用途に合わせて編集してください。文字・絵文字の見た目は作成端末のフォントに依存します。',
    ),
  );
  return files;
}
export async function faviconZip(source: HTMLCanvasElement) {
  const [{ default: JSZip }, files] = await Promise.all([import('jszip'), faviconFiles(source)]);
  const zip = new JSZip();
  for (const [name, bytes] of files) zip.file(name, bytes);
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
