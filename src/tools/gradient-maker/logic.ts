import { normalizeHex } from '../../lib/colors';

export type ColorStop = { id: number; color: string; position: number };
export type GradientSettings = { kind: 'linear' | 'radial'; angle: number; stops: ColorStop[] };
export const defaultGradient: GradientSettings = {
  kind: 'linear',
  angle: 135,
  stops: [
    { id: 0, color: '#91b8cb', position: 0 },
    { id: 1, color: '#eac0b5', position: 100 },
  ],
};
export const gradientPresets = [
  { name: '朝の空', colors: ['#91b8cb', '#eac0b5'] },
  { name: 'ラベンダー', colors: ['#a8b7ed', '#d7b7d9', '#f2c6c0'] },
  { name: '森の光', colors: ['#426953', '#a3c69f', '#ecdfb1'] },
  { name: '夕焼け', colors: ['#e9a06f', '#c56b88', '#6a5e91'] },
] as const;

export function gradientValue(settings: GradientSettings): string {
  if (settings.kind !== 'linear' && settings.kind !== 'radial')
    throw new Error('グラデーションの種類を確認してください。');
  if (!Number.isFinite(settings.angle) || settings.angle < 0 || settings.angle > 360)
    throw new Error('角度は0〜360度で指定してください。');
  if (settings.stops.length < 2 || settings.stops.length > 8)
    throw new Error('色は2〜8色で指定してください。');
  const stops = [...settings.stops]
    .sort((a, b) => a.position - b.position)
    .map((stop) => {
      const color = normalizeHex(stop.color);
      if (!color) throw new Error('色は3桁または6桁のHEXで入力してください。');
      if (!Number.isFinite(stop.position) || stop.position < 0 || stop.position > 100)
        throw new Error('色の位置は0〜100%で指定してください。');
      return `${color} ${stop.position}%`;
    })
    .join(', ');
  return settings.kind === 'linear'
    ? `linear-gradient(${settings.angle}deg, ${stops})`
    : `radial-gradient(circle, ${stops})`;
}

export function newStop(stops: ColorStop[], id: number): ColorStop {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  let start = 0;
  let gap = 0;
  for (let index = 0; index < sorted.length - 1; index++) {
    const left = sorted[index]!;
    const right = sorted[index + 1]!;
    if (right.position - left.position > gap) {
      start = left.position;
      gap = right.position - left.position;
    }
  }
  return { id, color: '#c8bfde', position: Math.round(start + gap / 2) };
}
