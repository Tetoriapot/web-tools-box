import { describe, expect, it } from 'vitest';
import {
  defaultRadius,
  randomRadius,
  radiusValue,
  sampleRadius,
  updateRadius,
} from '../../src/tools/border-radius-maker/logic';
import {
  calculateClamp,
  defaultClamp,
  sizeAtViewport,
} from '../../src/tools/clamp-calculator/logic';
import { seededRandom } from '../../src/lib/random';

describe('border radius', () => {
  it('exports all eight values in CSS corner order', () => {
    expect(radiusValue(sampleRadius)).toBe('35% 65% 70% 30% / 55% 35% 65% 45%');
    expect(radiusValue(defaultRadius)).toBe('25% 25% 25% 25% / 25% 25% 25% 25%');
  });
  it('links all eight values and supports isolated corner edits without mutation', () => {
    expect(updateRadius(defaultRadius, 'vertical', 3, 60)).toEqual({
      horizontal: [60, 60, 60, 60],
      vertical: [60, 60, 60, 60],
      linked: true,
    });
    const result = updateRadius(sampleRadius, 'horizontal', 2, 0);
    expect(result.horizontal).toEqual([35, 65, 0, 30]);
    expect(result.vertical).toEqual(sampleRadius.vertical);
    expect(sampleRadius.horizontal[2]).toBe(70);
  });
  it.each([-1, 101, NaN, Infinity])('refuses invalid radius %s', (value) => {
    expect(() => radiusValue({ ...defaultRadius, horizontal: [value, 0, 0, 0] })).toThrow('角丸');
    expect(() => updateRadius(defaultRadius, 'vertical', 0, value)).toThrow('角丸');
  });
  it('generates blob values with matching neighboring pairs and unlinks them', () => {
    const random = seededRandom(42);
    const first = randomRadius(random);
    const second = randomRadius(random);
    expect(first).not.toEqual(second);
    for (const result of [first, second]) {
      expect(result.linked).toBe(false);
      expect(result.horizontal[0] + result.horizontal[1]).toBe(100);
      expect(result.horizontal[2] + result.horizontal[3]).toBe(100);
      expect(result.vertical[0] + result.vertical[3]).toBe(100);
      expect(result.vertical[1] + result.vertical[2]).toBe(100);
      expect(
        [...result.horizontal, ...result.vertical].every((value) => value >= 25 && value <= 75),
      ).toBe(true);
    }
  });
});

describe('clamp calculation', () => {
  it('calculates the endpoints, midpoint, and bounded extrapolation', () => {
    const result = calculateClamp(defaultClamp);
    expect(sizeAtViewport(result, 360)).toBe(16);
    expect(sizeAtViewport(result, 720)).toBe(20);
    expect(sizeAtViewport(result, 1080)).toBe(24);
    expect(sizeAtViewport(result, 1)).toBe(16);
    expect(sizeAtViewport(result, 10000)).toBe(24);
    expect(result.css).toBe('clamp(16px, calc(12px + 1.111111vw), 24px)');
  });
  it('supports negative intercepts, decimals, zero size and equal sizes', () => {
    const negative = calculateClamp({
      ...defaultClamp,
      minSize: '8',
      maxSize: '48',
      minViewport: '1000',
      maxViewport: '1200',
    });
    expect(negative.css).toBe('clamp(8px, calc(-192px + 20vw), 48px)');
    expect(sizeAtViewport(negative, 1100)).toBeCloseTo(28);
    const decimal = calculateClamp({ ...defaultClamp, minSize: '12.5', maxSize: '24.5' });
    expect(sizeAtViewport(decimal, 720)).toBeCloseTo(18.5);
    expect(calculateClamp({ ...defaultClamp, minSize: '0', maxSize: '0' }).css).toBe(
      'clamp(0px, 0px, 0px)',
    );
  });
  it.each(['', '-1', '1001', 'Infinity', '1e309', 'abc'])('rejects invalid size %s', (value) => {
    expect(() => calculateClamp({ ...defaultClamp, minSize: value })).toThrow();
  });
  it('rejects reversed and degenerate intervals and oversized viewports', () => {
    expect(() => calculateClamp({ ...defaultClamp, maxSize: '1' })).toThrow('最大サイズ');
    expect(() => calculateClamp({ ...defaultClamp, maxViewport: '360' })).toThrow('大きく');
    expect(() => calculateClamp({ ...defaultClamp, maxViewport: '300' })).toThrow('大きく');
    expect(() => calculateClamp({ ...defaultClamp, maxViewport: '360.001' })).toThrow('1px以上');
    expect(() => calculateClamp({ ...defaultClamp, maxViewport: '10001' })).toThrow('10,000');
    expect(() => calculateClamp({ ...defaultClamp, minViewport: '0' })).toThrow('最小画面幅');
  });
});
