import QRCode from 'qrcode';
import { canvasContext, color } from '../../lib/canvas';

export type QrSettings = { size: string; margin: number; foreground: string; background: string };
export const defaultQr: QrSettings = {
  size: '320',
  margin: 4,
  foreground: '#163d2b',
  background: '#ffffff',
};
function luminance(hex: string) {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}
export function qrData(text: string, settings: QrSettings) {
  if (!text.trim()) throw new Error('URLまたはテキストを入力してください。');
  if (new TextEncoder().encode(text).length > 1500)
    throw new Error('入力はUTF-8で1,500バイト以内にしてください。');
  const size = Number(settings.size);
  if (!Number.isInteger(size) || size < 128 || size > 2048)
    throw new Error('サイズは128〜2,048pxの整数にしてください。');
  const foreground = color(settings.foreground),
    background = color(settings.background);
  const dark = luminance(foreground),
    light = luminance(background);
  if (dark >= light || (light + 0.05) / (dark + 0.05) < 4.5)
    throw new Error(
      '読み取りやすいように、前景を暗く・背景を明るくし、十分な明暗差をつけてください。',
    );
  if (!Number.isInteger(settings.margin) || settings.margin < 4 || settings.margin > 12)
    throw new Error('余白は4〜12モジュールにしてください。');
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const modules = qr.modules.size,
    total = modules + settings.margin * 2;
  if (size < total * 2)
    throw new Error(`この内容には${total * 2}px以上が必要です。サイズを大きくしてください。`);
  return { size, foreground, background, qr, modules, total, margin: settings.margin };
}
export function qrSvg(text: string, settings: QrSettings) {
  const data = qrData(text, settings);
  const paths: string[] = [];
  for (let y = 0; y < data.modules; y++)
    for (let x = 0; x < data.modules; x++)
      if (data.qr.modules.get(y, x)) paths.push(`M${x + data.margin} ${y + data.margin}h1v1h-1z`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${data.size}" height="${data.size}" viewBox="0 0 ${data.total} ${data.total}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${data.background}"/><path d="${paths.join('')}" fill="${data.foreground}"/></svg>`;
}
export function renderQr(text: string, settings: QrSettings) {
  const data = qrData(text, settings),
    { canvas, context } = canvasContext(data.size, data.size);
  context.fillStyle = data.background;
  context.fillRect(0, 0, data.size, data.size);
  context.fillStyle = data.foreground;
  const scale = data.size / data.total;
  for (let y = 0; y < data.modules; y++)
    for (let x = 0; x < data.modules; x++)
      if (data.qr.modules.get(y, x)) {
        const left = Math.round((x + data.margin) * scale),
          top = Math.round((y + data.margin) * scale);
        context.fillRect(
          left,
          top,
          Math.round((x + data.margin + 1) * scale) - left,
          Math.round((y + data.margin + 1) * scale) - top,
        );
      }
  return canvas;
}
