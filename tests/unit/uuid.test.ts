import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatUuids, generateUuids, parseCount } from '../../src/tools/uuid-generator/logic';

const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/;
afterEach(() => vi.unstubAllGlobals());

describe('UUID v4', () => {
  it('generates 100 unique IDs with correct version and variant bits', () => {
    const ids = generateUuids(100);
    expect(new Set(ids).size).toBe(100);
    expect(ids.every((id) => uuidPattern.test(id))).toBe(true);
  });
  it('supports secure getRandomValues fallback', () => {
    const realCrypto = globalThis.crypto;
    vi.stubGlobal('crypto', { getRandomValues: realCrypto.getRandomValues.bind(realCrypto) });
    expect(generateUuids(4).every((id) => uuidPattern.test(id))).toBe(true);
  });
  it('fails safely if secure random APIs are unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    expect(() => generateUuids(1)).toThrow('安全な乱数');
  });
  it.each(['', '0', '-1', '101', '1.5', 'hello', 'Infinity', '1e2'])(
    'rejects invalid count %s',
    (value) => {
      expect(() => parseCount(value)).toThrow('1〜100');
    },
  );
  it('accepts bounds and preserves chosen separator', () => {
    expect(parseCount('1')).toBe(1);
    expect(parseCount('100')).toBe(100);
    expect(formatUuids(['a', 'b'], 'csv')).toBe('a,b');
    expect(formatUuids(['a', 'b'], 'lines')).toBe('a\nb');
    expect(formatUuids([], 'lines')).toBe('');
  });
  it.each([0, 101, NaN, Infinity, 1.5])('guards direct invalid count %s', (count) => {
    expect(() => generateUuids(count)).toThrow('1〜100');
  });
});
