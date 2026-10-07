import { describe, expect, it } from 'vitest';
import { hexToRgb, normalizeHex } from '../../src/lib/colors';
import { defaultGradient, gradientValue, newStop } from '../../src/tools/gradient-maker/logic';
import { defaultShadow, shadowValue } from '../../src/tools/box-shadow-maker/logic';

describe('safe color handling', () => {
  it('normalizes shorthand, optional hash and case', () => {
    expect(normalizeHex('AbC')).toBe('#aabbcc');
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(normalizeHex(' #123456 ')).toBe('#123456');
  });
  it.each(['', '#12', '#12345g', 'red', 'url(https://example.com)', '#fff; color: red'])(
    'rejects invalid CSS color %s',
    (value) => {
      expect(normalizeHex(value)).toBeNull();
      expect(() => hexToRgb(value)).toThrow('HEX');
    },
  );
});

describe('gradient CSS', () => {
  it('emits linear and radial gradients without changing state', () => {
    expect(gradientValue(defaultGradient)).toBe(
      'linear-gradient(135deg, #91b8cb 0%, #eac0b5 100%)',
    );
    expect(gradientValue({ ...defaultGradient, kind: 'radial' })).toBe(
      'radial-gradient(circle, #91b8cb 0%, #eac0b5 100%)',
    );
  });
  it('sorts positions, preserves duplicate stops and finds midpoint for additions', () => {
    const stops = [
      { id: 0, color: '#fff', position: 100 },
      { id: 1, color: '#000', position: 0 },
    ];
    expect(gradientValue({ ...defaultGradient, stops })).toContain('#000000 0%, #ffffff 100%');
    expect(stops[0]?.position).toBe(100);
    expect(newStop(stops, 2).position).toBe(50);
    expect(
      gradientValue({
        ...defaultGradient,
        stops: [
          { id: 0, color: '#fff', position: 50 },
          { id: 1, color: '#000', position: 50 },
        ],
      }),
    ).toContain('#ffffff 50%, #000000 50%');
  });
  it('rejects invalid angles, colors, stop counts and positions', () => {
    expect(() => gradientValue({ ...defaultGradient, angle: NaN })).toThrow('角度');
    expect(() => gradientValue({ ...defaultGradient, stops: [] })).toThrow('2〜8');
    expect(() =>
      gradientValue({ ...defaultGradient, stops: Array(9).fill(defaultGradient.stops[0]) }),
    ).toThrow('2〜8');
    expect(() =>
      gradientValue({
        ...defaultGradient,
        stops: [{ id: 0, color: 'bad;', position: 0 }, defaultGradient.stops[1]!],
      }),
    ).toThrow('HEX');
    expect(() =>
      gradientValue({
        ...defaultGradient,
        stops: [{ id: 0, color: '#fff', position: 101 }, defaultGradient.stops[1]!],
      }),
    ).toThrow('0〜100');
  });
});

describe('box-shadow CSS', () => {
  it('outputs exact CSS and supports inset and negative spread', () => {
    expect(shadowValue(defaultShadow)).toBe('0px 8px 24px 0px rgba(0, 0, 0, 0.15)');
    expect(
      shadowValue({
        ...defaultShadow,
        x: -10,
        spread: -5,
        color: '#abc',
        opacity: 100,
        inset: true,
      }),
    ).toBe('inset -10px 8px 24px -5px rgba(170, 187, 204, 1)');
  });
  it('rejects non-finite or unsafe values', () => {
    expect(() => shadowValue({ ...defaultShadow, blur: -1 })).toThrow('範囲');
    expect(() => shadowValue({ ...defaultShadow, opacity: 101 })).toThrow('範囲');
    expect(() => shadowValue({ ...defaultShadow, x: NaN })).toThrow('範囲');
  });
});
