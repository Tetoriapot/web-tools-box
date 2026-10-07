import { normalizeHex } from './colors';

export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type Size = { width: number; height: number };
export const MAX_PIXELS = 16_000_000;
export const MAX_SIDE = 8192;
export const formats = [
  { id: 'png', label: 'PNG' },
  { id: 'jpeg', label: 'JPEG' },
  { id: 'webp', label: 'WebP' },
] as const;

export function dimensions(width: number, height: number): Size {
  if (
    ![width, height].every((n) => Number.isInteger(n) && n >= 1 && n <= MAX_SIDE) ||
    width * height > MAX_PIXELS
  )
    throw new Error('サイズは各辺1〜8,192px、合計1,600万画素以内にしてください。');
  return { width, height };
}
export function canvasContext(width: number, height: number) {
  dimensions(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('このブラウザでは画像処理を利用できません。');
  return { canvas, context };
}
export function canvasBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat = 'png',
  quality = 0.92,
): Promise<Blob> {
  const type = `image/${format}`;
  if (!Number.isFinite(quality) || quality < 0 || quality > 1)
    throw new Error('品質は0〜100%にしてください。');
  return new Promise((resolve, reject) => {
    if (typeof canvas.toBlob !== 'function') {
      reject(new Error('このブラウザでは画像を書き出せません。'));
      return;
    }
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('画像の書き出しに失敗しました。サイズを小さくしてください。'));
        else if (blob.type !== type)
          reject(new Error(`${format.toUpperCase()}での保存に未対応です。PNGをお試しください。`));
        else resolve(blob);
      },
      type,
      quality,
    );
  });
}
export function color(value: string) {
  const hex = normalizeHex(value);
  if (!hex) throw new Error('色は3桁または6桁のHEXで入力してください。');
  return hex;
}
export function fitRect(
  source: Size,
  box: Size,
  mode: 'contain' | 'cover' | 'stretch' = 'contain',
) {
  if (mode === 'stretch') return { x: 0, y: 0, ...box };
  const scale =
    mode === 'cover'
      ? Math.max(box.width / source.width, box.height / source.height)
      : Math.min(box.width / source.width, box.height / source.height);
  const width = source.width * scale,
    height = source.height * scale;
  return { x: (box.width - width) / 2, y: (box.height - height) / 2, width, height };
}
export function drawFitted(
  context: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  mode: 'contain' | 'cover' | 'stretch' = 'contain',
) {
  const rect = fitRect(source, { width, height }, mode);
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, x + rect.x, y + rect.y, rect.width, rect.height);
  context.restore();
}
export function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(Math.max(radius, 0), width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}
