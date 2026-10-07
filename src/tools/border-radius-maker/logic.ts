import { assertRange } from '../../lib/numbers';

export type Corners = [number, number, number, number];
export type RadiusSettings = { horizontal: Corners; vertical: Corners; linked: boolean };
export const corners = ['左上', '右上', '右下', '左下'] as const;
export const defaultRadius: RadiusSettings = {
  horizontal: [25, 25, 25, 25],
  vertical: [25, 25, 25, 25],
  linked: true,
};
export const sampleRadius: RadiusSettings = {
  horizontal: [35, 65, 70, 30],
  vertical: [55, 35, 65, 45],
  linked: false,
};

export function radiusValue(settings: RadiusSettings): string {
  if (settings.horizontal.length !== 4 || settings.vertical.length !== 4)
    throw new Error('角丸には横4値・縦4値が必要です。');
  [...settings.horizontal, ...settings.vertical].forEach((value) =>
    assertRange(value, 0, 100, '角丸'),
  );
  return `${settings.horizontal.map((value) => `${value}%`).join(' ')} / ${settings.vertical.map((value) => `${value}%`).join(' ')}`;
}

export function updateRadius(
  settings: RadiusSettings,
  axis: 'horizontal' | 'vertical',
  index: number,
  value: number,
): RadiusSettings {
  assertRange(value, 0, 100, '角丸');
  if (!Number.isInteger(index) || index < 0 || index > 3)
    throw new Error('角の位置を確認してください。');
  if (settings.linked)
    return {
      horizontal: [value, value, value, value],
      vertical: [value, value, value, value],
      linked: true,
    };
  const values: Corners = [...settings[axis]];
  values[index] = value;
  return { ...settings, [axis]: values };
}

export function randomRadius(random = Math.random): RadiusSettings {
  const pair = (): [number, number] => {
    const value = Math.round(25 + random() * 50);
    return [value, 100 - value];
  };
  const [a, b] = pair();
  const [c, d] = pair();
  const [e, f] = pair();
  const [g, h] = pair();
  return { horizontal: [a, b, c, d], vertical: [e, g, h, f], linked: false };
}
