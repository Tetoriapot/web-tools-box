import { describe, expect, it } from 'vitest';
import {
  backgroundOutput,
  defaultBackground,
  patterns,
} from '../../src/tools/svg-background-maker/logic';
import { defaultShape, shapeOutput, shapes } from '../../src/tools/svg-shape-maker/logic';
import { svgDataUri } from '../../src/lib/svg';
import { seededRandom } from '../../src/lib/random';

function parsedSvg(svg: string) {
  const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
  expect(document.querySelector('parsererror')).toBeNull();
  expect(document.documentElement.namespaceURI).toBe('http://www.w3.org/2000/svg');
  expect(document.querySelector('script, foreignObject, image, use')).toBeNull();
  expect(svg).not.toMatch(/NaN|Infinity|onload=|href=/);
  return document;
}

describe('SVG output safety', () => {
  it('encodes markup, CSS-sensitive punctuation and round-trips exactly', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><title>it's (safe)! 日本語</title></svg>`;
    const uri = svgDataUri(svg);
    expect(uri).not.toMatch(/["'()<>\s]/);
    expect(decodeURIComponent(uri.split(',')[1]!)).toBe(svg);
    expect(() => svgDataUri('x'.repeat(100001))).toThrow('サイズ');
  });
  it('keeps decorative seeded randomness deterministic and bounded', () => {
    const a = seededRandom(4294967295);
    const b = seededRandom(4294967295);
    for (let index = 0; index < 100; index++) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('SVG background', () => {
  it.each(patterns)('exports valid $id tiles and matching CSS/Data URI', ({ id }) => {
    const result = backgroundOutput({ ...defaultBackground, pattern: id });
    const document = parsedSvg(result.svg);
    expect(document.documentElement.getAttribute('width')).toBe(
      String(Number(result.width.toFixed(6))),
    );
    expect(decodeURIComponent(result.uri.split(',')[1]!)).toBe(result.svg);
    expect(result.css).toContain(`url("${result.uri}")`);
    expect(result.css).toContain('background-repeat: repeat;');
  });
  it('omits the background rectangle for transparency, without losing the pattern', () => {
    const result = backgroundOutput({
      ...defaultBackground,
      transparent: true,
      background: 'invalid-unused-color',
    });
    const document = parsedSvg(result.svg);
    expect(document.querySelector('rect')).toBeNull();
    expect(document.querySelector('circle')).not.toBeNull();
  });
  it('rejects injected color values and invalid size/line widths', () => {
    expect(() =>
      backgroundOutput({ ...defaultBackground, foreground: '#fff" onload="alert(1)' }),
    ).toThrow('HEX');
    expect(() =>
      backgroundOutput({ ...defaultBackground, background: 'url(https://example.com)' }),
    ).toThrow('HEX');
    expect(() => backgroundOutput({ ...defaultBackground, size: NaN })).toThrow('サイズ');
    expect(() => backgroundOutput({ ...defaultBackground, thickness: 9 })).toThrow('太さ');
  });
});

describe('SVG shapes', () => {
  it.each(shapes)(
    'generates stable, closed $id geometry with varied seed and complexity',
    ({ id }) => {
      const settings = { ...defaultShape, kind: id };
      const first = shapeOutput(settings);
      parsedSvg(first.svg);
      expect(first.path.endsWith('Z')).toBe(true);
      expect(shapeOutput(settings)).toEqual(first);
      expect(shapeOutput({ ...settings, seed: '43' }).path).not.toBe(first.path);
      expect(shapeOutput({ ...settings, complexity: 5 }).path).not.toBe(first.path);
      expect(first.svg.length).toBeLessThan(100000);
    },
  );
  it('reflects around the viewBox bounds without changing source geometry', () => {
    const first = shapeOutput(defaultShape);
    const flipped = shapeOutput({ ...defaultShape, flipX: true, flipY: true });
    expect(flipped.path).toBe(first.path);
    expect(flipped.svg).toContain('translate(1200 300) scale(-1 -1)');
    expect(parsedSvg(flipped.svg).documentElement.getAttribute('viewBox')).toBe('0 0 1200 300');
  });
  it.each(['', '-1', '4294967296', '1.5', 'NaN', 'Infinity'])('rejects invalid seed %s', (seed) => {
    expect(() => shapeOutput({ ...defaultShape, seed })).toThrow('Seed');
  });
  it('supports seed boundaries and highest complexity without overflow', () => {
    for (const seed of ['0', '4294967295'])
      for (const shape of shapes) {
        const result = shapeOutput({
          ...defaultShape,
          kind: shape.id,
          seed,
          complexity: 12,
          height: 80,
        });
        parsedSvg(result.svg);
        expect(result.svg.length).toBeLessThan(10000);
        // Control points and vertices stay inside the declared viewBox.
        const coordinates = result.path.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
        coordinates.forEach((value, index) => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(index % 2 ? 80 : 1200);
        });
      }
  });
  it('rejects invalid colors, heights and complexity values', () => {
    expect(() => shapeOutput({ ...defaultShape, color: '</svg><script/>' })).toThrow('HEX');
    expect(() => shapeOutput({ ...defaultShape, height: 100000 })).toThrow('高さ');
    expect(() => shapeOutput({ ...defaultShape, complexity: 2.5 })).toThrow('整数');
  });
});
