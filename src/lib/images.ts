import { canvasContext } from './canvas';
import { imageMime, validateFile } from './local-files';
import { withRasterImage } from './raster';

export const MAX_RASTER_BYTES = 10 * 1024 * 1024;
export const IMAGE_HINT = 'PNG / JPEG / WebP · 10 MiB / 1,600万画素 / 各辺8,192pxまで';
export type LocalImage = { canvas: HTMLCanvasElement; name: string; bytes?: number };

export async function readImage(file: File): Promise<LocalImage> {
  validateFile(file, ['.png', '.jpg', '.jpeg', '.webp'], MAX_RASTER_BYTES);
  if (typeof file.arrayBuffer !== 'function' || typeof URL.createObjectURL !== 'function')
    throw new Error('このブラウザでは画像を読み込めません。');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = imageMime(bytes, MAX_RASTER_BYTES);
  if (file.type && file.type !== 'application/octet-stream' && file.type !== mime)
    throw new Error('ファイル形式と画像データが一致しません。');
  return withRasterImage(
    bytes,
    mime,
    (image) => {
      const { canvas, context } = canvasContext(image.naturalWidth, image.naturalHeight);
      context.drawImage(image, 0, 0);
      return { canvas, name: file.name, bytes: file.size };
    },
    8192,
  );
}

export function sampleImage(): LocalImage {
  const { canvas, context } = canvasContext(800, 500);
  context.fillStyle = '#e9eee5';
  context.fillRect(0, 0, 800, 500);
  context.fillStyle = '#ffffff';
  context.fillRect(45, 45, 710, 410);
  context.fillStyle = '#196b54';
  context.fillRect(80, 85, 48, 48);
  context.font = 'bold 28px sans-serif';
  context.fillStyle = '#222d29';
  context.fillText('Small tools, good ideas.', 150, 119);
  context.fillStyle = '#e7edf4';
  context.fillRect(80, 172, 300, 240);
  context.fillStyle = '#a4b9cf';
  context.beginPath();
  context.arc(230, 292, 65, 0, Math.PI * 2);
  context.fill();
  for (let i = 0; i < 4; i++) {
    context.fillStyle = i ? '#d5ded7' : '#196b54';
    context.fillRect(425, 184 + i * 55, i ? 240 - i * 25 : 200, i ? 15 : 26);
  }
  return { canvas, name: 'sample.png' };
}
