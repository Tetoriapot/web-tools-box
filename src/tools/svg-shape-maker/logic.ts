import { normalizeHex } from '../../lib/colors';
import { assertRange, formatNumber as n, parseNumber } from '../../lib/numbers';
import { seededRandom } from '../../lib/random';
import { svgDataUri, svgDocument } from '../../lib/svg';

export const shapes = [
  { id: 'wave', label: '波 / Wave' },
  { id: 'blob', label: '丸い形 / Blob' },
  { id: 'mountain', label: '山 / Mountain' },
  { id: 'curve', label: '曲線 / Curve' },
  { id: 'zigzag', label: 'ジグザグ' },
] as const;
export type ShapeKind = (typeof shapes)[number]['id'];
export type ShapeSettings = {
  kind: ShapeKind;
  height: number;
  complexity: number;
  color: string;
  seed: string;
  flipX: boolean;
  flipY: boolean;
};
export const SHAPE_WIDTH = 1200;
export const defaultShape: ShapeSettings = {
  kind: 'wave',
  height: 300,
  complexity: 4,
  color: '#7d9f8a',
  seed: '42',
  flipX: false,
  flipY: false,
};
export const sampleShape: ShapeSettings = {
  kind: 'blob',
  height: 500,
  complexity: 7,
  color: '#a397c4',
  seed: '2026',
  flipX: false,
  flipY: false,
};
type Point = { x: number; y: number };
const point = (value: Point) => `${n(value.x, 3)} ${n(value.y, 3)}`;

function blobPath(height: number, complexity: number, random: () => number): string {
  const count = Math.max(6, complexity * 2);
  const points: Point[] = Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    const radius = 0.72 + random() * 0.28;
    return {
      x: SHAPE_WIDTH / 2 + Math.cos(angle) * SHAPE_WIDTH * 0.36 * radius,
      y: height / 2 + Math.sin(angle) * height * 0.36 * radius,
    };
  });
  let path = `M${point(points[0]!)}`;
  for (let index = 0; index < count; index++) {
    const before = points[(index - 1 + count) % count]!;
    const start = points[index]!;
    const end = points[(index + 1) % count]!;
    const after = points[(index + 2) % count]!;
    path += `C${point({ x: start.x + (end.x - before.x) / 6, y: start.y + (end.y - before.y) / 6 })} ${point({ x: end.x - (after.x - start.x) / 6, y: end.y - (after.y - start.y) / 6 })} ${point(end)}`;
  }
  return `${path}Z`;
}

function boundaryPath(
  kind: Exclude<ShapeKind, 'blob'>,
  height: number,
  complexity: number,
  random: () => number,
): string {
  const segments = kind === 'curve' ? complexity : complexity * 2;
  const points: Point[] = Array.from({ length: segments + 1 }, (_, index) => {
    const variance = random();
    const level =
      kind === 'zigzag'
        ? (index % 2 ? 0.72 : 0.28) + (variance - 0.5) * 0.08
        : kind === 'wave'
          ? (index % 2 ? 0.62 : 0.38) + (variance - 0.5) * 0.22
          : 0.18 + variance * 0.58;
    return { x: (SHAPE_WIDTH * index) / segments, y: level * height };
  });
  let path = `M0 ${height}L${point(points[0]!)}`;
  for (let index = 1; index < points.length; index++) {
    const start = points[index - 1]!;
    const end = points[index]!;
    if (kind === 'wave' || kind === 'curve') {
      const middle = (start.x + end.x) / 2;
      path += `C${n(middle, 3)} ${n(start.y, 3)} ${n(middle, 3)} ${n(end.y, 3)} ${point(end)}`;
    } else path += `L${point(end)}`;
  }
  return `${path}L${SHAPE_WIDTH} ${height}Z`;
}

export function shapeOutput(settings: ShapeSettings) {
  if (!shapes.some((shape) => shape.id === settings.kind))
    throw new Error('シェイプの種類を確認してください。');
  assertRange(settings.height, 80, 600, '高さ');
  assertRange(settings.complexity, 2, 12, '複雑さ');
  if (!Number.isInteger(settings.complexity)) throw new Error('複雑さは整数で指定してください。');
  const color = normalizeHex(settings.color);
  if (!color) throw new Error('色は3桁または6桁のHEXで入力してください。');
  const seed = parseNumber(settings.seed, 0, 4294967295, 'Seed');
  if (!Number.isInteger(seed)) throw new Error('Seedは整数で入力してください。');
  const random = seededRandom(seed);
  const path =
    settings.kind === 'blob'
      ? blobPath(settings.height, settings.complexity, random)
      : boundaryPath(settings.kind, settings.height, settings.complexity, random);
  const transform =
    settings.flipX || settings.flipY
      ? ` transform="translate(${settings.flipX ? SHAPE_WIDTH : 0} ${settings.flipY ? settings.height : 0}) scale(${settings.flipX ? -1 : 1} ${settings.flipY ? -1 : 1})"`
      : '';
  const svg = svgDocument(
    SHAPE_WIDTH,
    settings.height,
    `<path d="${path}" fill="${color}"${transform}/>`,
    settings.kind !== 'blob',
  );
  return { svg, uri: svgDataUri(svg), path };
}
