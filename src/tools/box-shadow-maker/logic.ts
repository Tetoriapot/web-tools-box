import { hexToRgb } from '../../lib/colors';

export type ShadowSettings = {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
};
export const defaultShadow: ShadowSettings = {
  x: 0,
  y: 8,
  blur: 24,
  spread: 0,
  color: '#000000',
  opacity: 15,
  inset: false,
};
export const sampleShadow: ShadowSettings = {
  x: 12,
  y: 16,
  blur: 30,
  spread: -6,
  color: '#365b4d',
  opacity: 35,
  inset: false,
};

export function shadowValue(settings: ShadowSettings): string {
  const ranges: [number, number, number][] = [
    [settings.x, -100, 100],
    [settings.y, -100, 100],
    [settings.blur, 0, 100],
    [settings.spread, -50, 50],
    [settings.opacity, 0, 100],
  ];
  if (ranges.some(([value, min, max]) => !Number.isFinite(value) || value < min || value > max))
    throw new Error('影の値が指定できる範囲を超えています。');
  const [r, g, b] = hexToRgb(settings.color);
  return `${settings.inset ? 'inset ' : ''}${settings.x}px ${settings.y}px ${settings.blur}px ${settings.spread}px rgba(${r}, ${g}, ${b}, ${settings.opacity / 100})`;
}
