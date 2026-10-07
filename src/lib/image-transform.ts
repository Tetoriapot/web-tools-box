import {
  canvasContext,
  color,
  dimensions,
  drawFitted,
  fitRect,
  type ImageFormat,
  type Size,
} from './canvas';

export type ResizeMode = 'fit' | 'contain' | 'cover' | 'stretch';
export function targetSize(
  source: Size,
  width: string,
  height: string,
  percent: string | null,
  mode: ResizeMode,
): Size {
  const box =
    percent !== null
      ? {
          width: Math.max(1, Math.round((source.width * Number(percent)) / 100)),
          height: Math.max(1, Math.round((source.height * Number(percent)) / 100)),
        }
      : { width: Number(width), height: Number(height) };
  if (
    percent !== null &&
    (!percent.trim() ||
      !Number.isFinite(Number(percent)) ||
      Number(percent) < 0.01 ||
      Number(percent) > 400)
  )
    throw new Error('倍率は0.01〜400%で入力してください。');
  dimensions(box.width, box.height);
  if (mode === 'fit') {
    const fit = fitRect(source, box);
    return dimensions(Math.max(1, Math.round(fit.width)), Math.max(1, Math.round(fit.height)));
  }
  return box;
}
export function transformImage(
  source: HTMLCanvasElement,
  target: Size,
  mode: ResizeMode,
  format: ImageFormat,
  matte: string,
) {
  const { canvas, context } = canvasContext(target.width, target.height);
  if (format === 'jpeg') {
    context.fillStyle = color(matte);
    context.fillRect(0, 0, target.width, target.height);
  }
  drawFitted(context, source, 0, 0, target.width, target.height, mode === 'fit' ? 'contain' : mode);
  return canvas;
}
