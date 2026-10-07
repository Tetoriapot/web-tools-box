import { MAX_TEXT_LENGTH } from './files';
import { withRasterImage } from './raster';

export const MAX_TEXT_BYTES = 400_000;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp';

export function validateFile(file: File, extensions: readonly string[], maxBytes: number) {
  if (!extensions.some((extension) => file.name.toLowerCase().endsWith(extension)))
    throw new Error(`対応するファイルを選択してください（${extensions.join(' / ')}）。`);
  if (file.size === 0) throw new Error('ファイルが空です。');
  if (file.size > maxBytes)
    throw new Error(`ファイルは${maxBytes.toLocaleString()}バイト以内にしてください。`);
}

export async function readTextFile(file: File, extensions: readonly string[]) {
  validateFile(file, extensions, MAX_TEXT_BYTES);
  if (typeof file.arrayBuffer !== 'function' || typeof TextDecoder !== 'function')
    throw new Error('このブラウザではファイルを読み込めません。テキストを貼り付けてください。');
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    throw new Error('UTF-8のテキストファイルとして読み込めませんでした。');
  }
  if (text.includes('\0')) throw new Error('バイナリファイルは読み込めません。');
  if (text.length > MAX_TEXT_LENGTH) throw new Error('入力は100,000文字以内にしてください。');
  return text;
}

export function imageMime(
  bytes: Uint8Array,
  maxBytes = MAX_IMAGE_BYTES,
): 'image/png' | 'image/jpeg' | 'image/webp' {
  if (bytes.length === 0 || bytes.length > maxBytes)
    throw new Error(`画像は空でない${maxBytes / 1024 / 1024} MiB以内のファイルにしてください。`);
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  const ascii = (start: number, text: string) =>
    [...text].every((character, i) => bytes[start + i] === character.charCodeAt(0));
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'image/webp';
  throw new Error('PNG・JPEG・WebPの画像データではありません。SVGは対象外です。');
}

export async function validateRaster(bytes: Uint8Array) {
  const mime = imageMime(bytes);
  return withRasterImage(bytes, mime, (image) => ({
    mime,
    width: image.naturalWidth,
    height: image.naturalHeight,
  }));
}
