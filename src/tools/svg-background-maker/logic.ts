import { normalizeHex } from '../../lib/colors';
import { assertRange, formatNumber as n } from '../../lib/numbers';
import { svgDataUri, svgDocument } from '../../lib/svg';

export const patterns = [
  { id: 'dots', label: 'ドット' },
  { id: 'grid', label: 'グリッド' },
  { id: 'stripe', label: '縦ストライプ' },
  { id: 'diagonal', label: '斜めストライプ' },
  { id: 'checker', label: '市松模様' },
  { id: 'triangle', label: '三角形' },
  { id: 'cross', label: '十字' },
  { id: 'hex', label: '六角形' },
] as const;
export type Pattern = (typeof patterns)[number]['id'];
export type BackgroundSettings = {
  pattern: Pattern;
  size: number;
  thickness: number;
  foreground: string;
  background: string;
  transparent: boolean;
};
export const defaultBackground: BackgroundSettings = {
  pattern: 'dots',
  size: 32,
  thickness: 4,
  foreground: '#7a9684',
  background: '#f4f7f2',
  transparent: false,
};
export const sampleBackground: BackgroundSettings = {
  pattern: 'hex',
  size: 48,
  thickness: 2,
  foreground: '#738dab',
  background: '#f0f4fa',
  transparent: false,
};
export const outputFormats = [
  { id: 'svg', label: 'SVG' },
  { id: 'css', label: 'CSS' },
  { id: 'uri', label: 'Data URI' },
] as const;
export type OutputFormat = (typeof outputFormats)[number]['id'];

export function backgroundOutput(settings: BackgroundSettings) {
  if (!patterns.some((pattern) => pattern.id === settings.pattern))
    throw new Error('パターンの種類を確認してください。');
  assertRange(settings.size, 12, 100, 'パターンサイズ');
  assertRange(settings.thickness, 1, 8, '太さ');
  const fg = normalizeHex(settings.foreground);
  const bg = normalizeHex(settings.background);
  if (!fg || (!settings.transparent && !bg))
    throw new Error('色は3桁または6桁のHEXで入力してください。');
  const s = settings.size;
  const t = settings.thickness;
  let width = s;
  let height = s;
  let drawing = '';
  const line = (path: string) =>
    `<path d="${path}" fill="none" stroke="${fg}" stroke-width="${t}"/>`;
  switch (settings.pattern) {
    case 'dots':
      drawing = `<circle cx="${n(s / 2)}" cy="${n(s / 2)}" r="${n(t / 2)}" fill="${fg}"/>`;
      break;
    case 'grid':
      drawing = line(`M0 0H${s}V${s}H0Z`);
      break;
    case 'stripe':
      drawing = `<rect width="${t}" height="${s}" fill="${fg}"/>`;
      break;
    case 'diagonal':
      drawing = line(
        `M${n(-s / 4)} ${n(s / 4)}L${n(s / 4)} ${n(-s / 4)}M0 ${s}L${s} 0M${n(s * 0.75)} ${n(s * 1.25)}L${n(s * 1.25)} ${n(s * 0.75)}`,
      );
      break;
    case 'checker':
      drawing = `<path d="M0 0H${n(s / 2)}V${n(s / 2)}H0ZM${n(s / 2)} ${n(s / 2)}H${s}V${s}H${n(s / 2)}Z" fill="${fg}"/>`;
      break;
    case 'triangle':
      drawing = `<path d="M${n(s / 2)} ${n(s * 0.18)}L${n(s * 0.82)} ${n(s * 0.8)}H${n(s * 0.18)}Z" fill="${fg}"/>`;
      break;
    case 'cross':
      drawing = line(
        `M${n(s / 2)} ${n(s / 4)}V${n(s * 0.75)}M${n(s / 4)} ${n(s / 2)}H${n(s * 0.75)}`,
      );
      break;
    case 'hex': {
      const a = s / 2;
      width = 3 * a;
      height = Math.sqrt(3) * a;
      drawing = line(
        `M0 ${n(height / 2)}L${n(a / 2)} 0H${n(a * 1.5)}L${n(a * 2)} ${n(height / 2)}L${n(a * 1.5)} ${n(height)}H${n(a / 2)}ZM${n(a * 2)} ${n(height / 2)}H${n(width)}`,
      );
      break;
    }
  }
  const background = settings.transparent
    ? ''
    : `<rect width="100%" height="100%" fill="${bg}"/>\n`;
  const svg = svgDocument(width, height, background + drawing);
  const uri = svgDataUri(svg);
  return {
    svg,
    uri,
    css: `background-image: url("${uri}");\nbackground-repeat: repeat;\nbackground-size: ${n(width)}px ${n(height)}px;`,
    width,
    height,
  };
}
