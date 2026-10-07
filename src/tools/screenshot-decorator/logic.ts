import {
  canvasContext,
  color,
  dimensions,
  drawFitted,
  roundedRect,
  type Size,
} from '../../lib/canvas';

export type Decoration = {
  background: string;
  gradient: boolean;
  endColor: string;
  padding: number;
  radius: number;
  shadow: number;
  border: number;
  borderColor: string;
  ratio: 'auto' | '1:1' | '4:3' | '16:9';
};
export const defaultDecoration: Decoration = {
  background: '#dce7e0',
  gradient: true,
  endColor: '#e6ddf0',
  padding: 64,
  radius: 16,
  shadow: 28,
  border: 1,
  borderColor: '#ffffff',
  ratio: 'auto',
};
export function decorationSize(source: Size, padding: number, ratio: Decoration['ratio']): Size {
  const scale = Math.min(1, 1600 / Math.max(source.width, source.height));
  let width = Math.max(1, Math.round(source.width * scale)) + padding * 2,
    height = Math.max(1, Math.round(source.height * scale)) + padding * 2;
  if (ratio !== 'auto') {
    const [w, h] = ratio.split(':').map(Number) as [number, number];
    const multiple = Math.ceil(Math.max(width / w, height / h));
    width = multiple * w;
    height = multiple * h;
  }
  return dimensions(width, height);
}
export function decorate(source: HTMLCanvasElement, settings: Decoration) {
  const { width, height } = decorationSize(source, settings.padding, settings.ratio);
  const { canvas, context } = canvasContext(width, height);
  const start = color(settings.background),
    end = settings.gradient ? color(settings.endColor) : start,
    border = settings.border ? color(settings.borderColor) : start;
  if (settings.gradient) {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, start);
    gradient.addColorStop(1, end);
    context.fillStyle = gradient;
  } else context.fillStyle = start;
  context.fillRect(0, 0, width, height);
  const scale = Math.min(1, 1600 / Math.max(source.width, source.height));
  const rect = {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
  const x = (width - rect.width) / 2,
    y = (height - rect.height) / 2;
  context.save();
  context.shadowColor = '#15261d55';
  context.shadowBlur = settings.shadow;
  context.shadowOffsetY = settings.shadow / 3;
  roundedRect(context, x, y, rect.width, rect.height, settings.radius);
  context.fillStyle = '#ffffff';
  context.fill();
  context.restore();
  context.save();
  roundedRect(context, x, y, rect.width, rect.height, settings.radius);
  context.clip();
  drawFitted(context, source, x, y, rect.width, rect.height);
  context.restore();
  const stroke = Math.min(settings.border, rect.width / 2, rect.height / 2);
  if (stroke) {
    roundedRect(
      context,
      x + stroke / 2,
      y + stroke / 2,
      rect.width - stroke,
      rect.height - stroke,
      Math.max(0, settings.radius - stroke / 2),
    );
    context.lineWidth = stroke;
    context.strokeStyle = border;
    context.stroke();
  }
  return canvas;
}
