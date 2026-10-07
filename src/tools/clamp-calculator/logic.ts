import { assertRange, formatNumber, parseNumber } from '../../lib/numbers';

export type ClampInput = {
  minSize: string;
  maxSize: string;
  minViewport: string;
  maxViewport: string;
};
export type ClampResult = {
  minSize: number;
  maxSize: number;
  minViewport: number;
  maxViewport: number;
  slope: number;
  intercept: number;
  css: string;
};
export const defaultClamp: ClampInput = {
  minSize: '16',
  maxSize: '24',
  minViewport: '360',
  maxViewport: '1080',
};
export const sampleClamp: ClampInput = {
  minSize: '20',
  maxSize: '48',
  minViewport: '360',
  maxViewport: '1440',
};

export function calculateClamp(input: ClampInput): ClampResult {
  const minSize = parseNumber(input.minSize, 0, 1000, '最小サイズ');
  const maxSize = parseNumber(input.maxSize, 0, 1000, '最大サイズ');
  const minViewport = parseNumber(input.minViewport, 1, 10000, '最小画面幅');
  const maxViewport = parseNumber(input.maxViewport, 1, 10000, '最大画面幅');
  if (maxSize < minSize) throw new Error('最大サイズは最小サイズ以上にしてください。');
  if (maxViewport <= minViewport) throw new Error('最大画面幅は最小画面幅より大きくしてください。');
  if (maxViewport - minViewport < 1)
    throw new Error('最小画面幅と最大画面幅は1px以上離してください。');
  const slope = (maxSize - minSize) / (maxViewport - minViewport);
  const intercept = minSize - slope * minViewport;
  const preferred =
    minSize === maxSize
      ? `${formatNumber(minSize)}px`
      : `calc(${formatNumber(intercept)}px + ${formatNumber(slope * 100)}vw)`;
  const css = `clamp(${formatNumber(minSize)}px, ${preferred}, ${formatNumber(maxSize)}px)`;
  return { minSize, maxSize, minViewport, maxViewport, slope, intercept, css };
}

export function sizeAtViewport(result: ClampResult, viewport: number): number {
  assertRange(viewport, 1, 10000, '確認する画面幅');
  return Math.min(
    result.maxSize,
    Math.max(result.minSize, result.intercept + result.slope * viewport),
  );
}
