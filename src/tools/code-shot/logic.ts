import { canvasContext, color, roundedRect } from '../../lib/canvas';
import { monoFont } from '../../lib/canvas-text';

export const CODE_SAMPLE =
  'const tools = {\n  simple: true,\n  local: true,\n  ready: "いつでも使える"\n};\n\nfunction createSomething() {\n  return "Small tools, good ideas.";\n}';
export const codeThemes = [
  { id: 'dark', label: 'ダーク' },
  { id: 'light', label: 'ライト' },
  { id: 'warm', label: 'ペーパー' },
] as const;
export type CodeSettings = {
  theme: 'dark' | 'light' | 'warm';
  fontSize: number;
  padding: number;
  lineNumbers: boolean;
  header: boolean;
  background: string;
};
export const defaultCodeSettings: CodeSettings = {
  theme: 'dark',
  fontSize: 20,
  padding: 48,
  lineNumbers: true,
  header: true,
  background: '#dce7e0',
};
export function codeLines(text: string) {
  if (!text.trim()) throw new Error('画像にするコードやテキストを入力してください。');
  if (text.length > 10_000) throw new Error('コードは10,000文字以内にしてください。');
  const lines = text.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
  if (lines.length > 120) throw new Error('コードは120行以内にしてください。');
  return lines;
}
export function renderCode(text: string, settings: CodeSettings) {
  const lines = codeLines(text),
    background = color(settings.background);
  const measure = canvasContext(1, 1).context;
  measure.font = `${settings.fontSize}px ${monoFont}`;
  const numbers = settings.lineNumbers ? measure.measureText(String(lines.length)).width + 24 : 0;
  const width = Math.ceil(
    Math.max(360, ...lines.map((line) => measure.measureText(line).width + 64 + numbers)) +
      settings.padding * 2,
  );
  if (width > 2400)
    throw new Error(
      '1行が長すぎます。改行するかフォントサイズを小さくしてください（幅2,400pxまで）。',
    );
  const lineHeight = settings.fontSize * 1.65,
    header = settings.header ? 52 : 0;
  const height = Math.ceil(lines.length * lineHeight + 64 + header + settings.padding * 2);
  const { canvas, context } = canvasContext(width, height);
  const palette = {
    dark: ['#202934', '#e6eef4', '#9caebd'],
    light: ['#ffffff', '#22362d', '#63786c'],
    warm: ['#fbf4e8', '#493f33', '#817160'],
  }[settings.theme];
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  roundedRect(
    context,
    settings.padding,
    settings.padding,
    width - settings.padding * 2,
    height - settings.padding * 2,
    12,
  );
  context.fillStyle = palette[0]!;
  context.fill();
  if (settings.header)
    for (const [i, color] of ['#dd7b77', '#dfbd69', '#82ac88'].entries()) {
      context.fillStyle = color;
      context.beginPath();
      context.arc(settings.padding + 28 + i * 22, settings.padding + 26, 6, 0, Math.PI * 2);
      context.fill();
    }
  context.font = `${settings.fontSize}px ${monoFont}`;
  context.textBaseline = 'top';
  lines.forEach((line, index) => {
    const y = settings.padding + header + 32 + index * lineHeight;
    if (settings.lineNumbers) {
      context.fillStyle = palette[2]!;
      context.textAlign = 'right';
      context.fillText(String(index + 1), settings.padding + 32 + numbers - 20, y);
    }
    context.textAlign = 'left';
    context.fillStyle = palette[1]!;
    context.fillText(line, settings.padding + 32 + numbers, y);
  });
  return canvas;
}
