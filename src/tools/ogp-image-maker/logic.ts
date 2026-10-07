import { canvasContext, color, drawFitted, roundedRect } from '../../lib/canvas';
import { fittedText, sansFont } from '../../lib/canvas-text';

export const ogpTemplates = [
  { id: 'minimal', label: 'ミニマル' },
  { id: 'split', label: '左右分割' },
  { id: 'frame', label: 'フレーム' },
  { id: 'band', label: '帯' },
  { id: 'editorial', label: 'エディトリアル' },
  { id: 'gradient', label: 'グラデーション' },
] as const;
export type OgpSettings = {
  title: string;
  subtitle: string;
  template: (typeof ogpTemplates)[number]['id'];
  background: string;
  foreground: string;
  accent: string;
};
export const defaultOgp: OgpSettings = {
  title: '小さな道具で、\n制作をもっと軽やかに。',
  subtitle: 'Web Tools Box — ブラウザで使える制作ツール集',
  template: 'minimal',
  background: '#f2f5ec',
  foreground: '#193d2c',
  accent: '#74a68c',
};
export function validateOgp(settings: OgpSettings) {
  if (!settings.title.trim()) throw new Error('タイトルを入力してください。');
  if (settings.title.length > 180 || settings.subtitle.length > 180)
    throw new Error('タイトル・サブタイトルはそれぞれ180文字以内にしてください。');
  return {
    background: color(settings.background),
    foreground: color(settings.foreground),
    accent: color(settings.accent),
  };
}
export function renderOgp(
  settings: OgpSettings,
  backgroundImage?: HTMLCanvasElement,
  logo?: HTMLCanvasElement,
) {
  const palette = validateOgp(settings),
    { canvas, context } = canvasContext(1200, 630);
  context.fillStyle = palette.background;
  context.fillRect(0, 0, 1200, 630);
  if (backgroundImage) drawFitted(context, backgroundImage, 0, 0, 1200, 630, 'cover');
  let x = 80,
    y = 180,
    width = 1040,
    titleSize = 64;
  context.fillStyle = palette.background;
  if (backgroundImage) {
    context.globalAlpha = 0.93;
    context.fillRect(40, 40, 1120, 550);
    context.globalAlpha = 1;
  }
  switch (settings.template) {
    case 'minimal':
      context.fillStyle = palette.accent;
      context.fillRect(80, 140, 80, 8);
      break;
    case 'split':
      width = 690;
      titleSize = 58;
      context.fillStyle = palette.accent;
      context.fillRect(860, 0, 340, 630);
      if (backgroundImage) drawFitted(context, backgroundImage, 860, 0, 340, 630, 'cover');
      else {
        context.fillStyle = palette.background;
        context.beginPath();
        context.arc(1030, 260, 110, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 0.45;
        context.fillRect(930, 405, 200, 16);
        context.globalAlpha = 1;
      }
      break;
    case 'frame':
      context.strokeStyle = palette.accent;
      context.lineWidth = 12;
      context.strokeRect(28, 28, 1144, 574);
      x = 100;
      width = 1000;
      break;
    case 'band':
      context.fillStyle = palette.accent;
      context.fillRect(0, 0, 1200, 28);
      context.fillRect(0, 568, 1200, 62);
      break;
    case 'editorial':
      x = 120;
      width = 960;
      context.fillStyle = palette.accent;
      context.fillRect(72, 170, 8, 310);
      context.font = `700 18px ${sansFont}`;
      context.fillStyle = palette.foreground;
      context.fillText('IDEAS / NOTES / CRAFT', 120, 140);
      y = 190;
      break;
    case 'gradient': {
      const gradient = context.createLinearGradient(0, 0, 1200, 630);
      gradient.addColorStop(0, palette.accent);
      gradient.addColorStop(1, palette.background);
      context.fillStyle = gradient;
      context.fillRect(0, 0, 1200, 630);
      if (backgroundImage) {
        context.globalAlpha = 0.65;
        drawFitted(context, backgroundImage, 0, 0, 1200, 630, 'cover');
        context.globalAlpha = 1;
      }
      context.fillStyle = palette.background;
      roundedRect(context, 48, 48, 1104, 534, 24);
      context.fill();
      x = 100;
      width = 1000;
      break;
    }
  }
  if (logo) drawFitted(context, logo, x, 64, 144, 72);
  const title = fittedText(context, settings.title, width, 3, titleSize, 34);
  context.fillStyle = palette.foreground;
  context.textBaseline = 'top';
  title.lines.forEach((line, index) => context.fillText(line, x, y + index * title.size * 1.38));
  const subtitleY = y + title.lines.length * title.size * 1.38 + 30;
  if (settings.subtitle.trim()) {
    const subtitle = fittedText(context, settings.subtitle, width, 2, 26, 18, 400);
    if (subtitleY + subtitle.lines.length * subtitle.size * 1.6 > 548)
      throw new Error('文字が収まりません。タイトルやサブタイトルを短くしてください。');
    subtitle.lines.forEach((line, index) =>
      context.fillText(line, x, subtitleY + index * subtitle.size * 1.6),
    );
  }
  return canvas;
}
