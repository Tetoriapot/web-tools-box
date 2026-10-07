import { MAX_TEXT_LENGTH } from '../../lib/files';
import { imageMime, MAX_IMAGE_BYTES, validateFile, validateRaster } from '../../lib/local-files';

export const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 200;
export const BASE64_TEXT_SAMPLE = 'こんにちは、Web Tools Box! 🌿';
export function sampleImageUri() {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('このブラウザではサンプル画像を作成できません。');
  context.fillStyle = '#e4f0e9';
  context.fillRect(0, 0, 240, 160);
  context.fillStyle = '#e4bc5b';
  context.beginPath();
  context.arc(180, 42, 18, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#7d9f8a';
  context.beginPath();
  context.moveTo(0, 160);
  context.lineTo(80, 52);
  context.lineTo(160, 160);
  context.fill();
  context.fillStyle = '#196b54';
  context.beginPath();
  context.moveTo(100, 160);
  context.lineTo(170, 80);
  context.lineTo(240, 160);
  context.fill();
  return canvas.toDataURL('image/png');
}

export function bytesToBase64(bytes: Uint8Array) {
  if (typeof btoa !== 'function') throw new Error('このブラウザではBase64変換を利用できません。');
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}

export function decodeBase64(input: string) {
  if (!input.trim()) throw new Error('Base64を入力してください。');
  if (input.length > MAX_BASE64_LENGTH)
    throw new Error('Base64は2 MiBのデータ相当までにしてください。');
  let base64 = input.trim();
  let mime = '';
  if (/^data:/i.test(base64)) {
    const match = /^data:([\w.+/-]+)?(?:;charset=utf-8)?;base64,/i.exec(base64);
    if (!match)
      throw new Error('Base64形式のData URLを入力してください。文字コードはUTF-8に対応します。');
    mime = (match[1] ?? '').toLowerCase();
    base64 = base64.slice(match[0].length);
  }
  base64 = base64.replace(/[\t\n\r ]/g, '');
  if (
    !base64 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(base64) ||
    base64.length % 4 === 1 ||
    (base64.includes('=') && base64.length % 4 !== 0)
  )
    throw new Error('Base64の文字やパディング（=）が正しくありません。');
  if (typeof atob !== 'function') throw new Error('このブラウザではBase64変換を利用できません。');
  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new Error('Base64をデコードできません。');
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error('デコード結果は2 MiB以内にしてください。');
  if (bytesToBase64(bytes).replace(/=+$/, '') !== base64.replace(/=+$/, ''))
    throw new Error('Base64の末尾のビットが正しくありません。');
  return { bytes, mime };
}

export function encodeText(text: string, dataUrl: boolean) {
  if (!text) throw new Error('テキストを入力してください。');
  if (text.length > MAX_TEXT_LENGTH) throw new Error('入力は100,000文字以内にしてください。');
  if (typeof TextEncoder !== 'function')
    throw new Error('このブラウザではUTF-8変換を利用できません。');
  if (/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(text))
    throw new Error('テキストに不正なUnicode文字が含まれています。');
  return `${dataUrl ? 'data:text/plain;charset=utf-8;base64,' : ''}${bytesToBase64(new TextEncoder().encode(text))}`;
}

export function decodeText(text: string) {
  const { bytes } = decodeBase64(text);
  if (typeof TextDecoder !== 'function')
    throw new Error('このブラウザではUTF-8変換を利用できません。');
  let decoded: string;
  try {
    decoded = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new Error('UTF-8テキストではありません。画像の場合は「画像」に切り替えてください。');
  }
  if (decoded.length > MAX_TEXT_LENGTH)
    throw new Error('デコード結果は100,000文字以内にしてください。');
  if (decoded.includes('\0')) throw new Error('バイナリデータはテキストとして表示できません。');
  return decoded;
}

export type ImageResult = {
  bytes: Uint8Array;
  mime: string;
  width: number;
  height: number;
  base64: string;
  url: string;
};
export async function imageResult(bytes: Uint8Array): Promise<ImageResult> {
  const metadata = await validateRaster(bytes);
  const base64 = bytesToBase64(bytes);
  return { ...metadata, bytes, base64, url: `data:${metadata.mime};base64,${base64}` };
}
export async function encodeImage(file: File) {
  validateFile(file, ['.png', '.jpg', '.jpeg', '.webp'], MAX_IMAGE_BYTES);
  if (typeof file.arrayBuffer !== 'function')
    throw new Error('このブラウザではファイルを読み込めません。');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = imageMime(bytes);
  if (file.type && file.type !== 'application/octet-stream' && file.type !== mime)
    throw new Error('ファイル形式と画像データが一致しません。');
  return imageResult(bytes);
}
export async function decodeImage(text: string) {
  const { bytes, mime } = decodeBase64(text);
  const actual = imageMime(bytes);
  if (mime && mime !== actual) throw new Error('Data URLの形式と画像データが一致しません。');
  return imageResult(bytes);
}
