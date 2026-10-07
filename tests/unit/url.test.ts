import { describe, expect, it } from 'vitest';
import { decodeText, encodeText, parseQuery } from '../../src/tools/url-encoder/logic';

describe('URL conversion', () => {
  it('round-trips Unicode, emoji and reserved characters', () => {
    const source = '日本語 🧰 +&=/?#\n';
    expect(decodeText(encodeText(source))).toBe(source);
    expect(decodeText('a+b')).toBe('a+b');
  });
  it.each(['%', '%ZZ', '%E3%81', '%FF'])('rejects malformed encoding %s', (input) => {
    expect(() => decodeText(input)).toThrow('デコード');
  });
  it('rejects lone UTF-16 surrogates when encoding', () => {
    expect(() => encodeText('\ud800')).toThrow('エンコード');
  });
  it('accepts the maximum length and rejects oversized or empty input', () => {
    expect(encodeText('a'.repeat(100_000))).toHaveLength(100_000);
    expect(() => encodeText('a'.repeat(100_001))).toThrow('100,000');
    expect(() => decodeText('  ')).toThrow('入力');
    expect(() => parseQuery('')).toThrow('入力');
  });
  it('preserves duplicate and empty keys and decodes plus only in query mode', () => {
    expect(parseQuery('https://example.com/?q=a+b&tag=one&tag=two&empty&=value#ignored')).toEqual([
      { key: 'q', value: 'a b' },
      { key: 'tag', value: 'one' },
      { key: 'tag', value: 'two' },
      { key: 'empty', value: '' },
      { key: '', value: 'value' },
    ]);
    expect(parseQuery('?encoded=a%3Db%26c&safe=%3Cscript%3E')).toEqual([
      { key: 'encoded', value: 'a=b&c' },
      { key: 'safe', value: '<script>' },
    ]);
  });
  it('rejects invalid query values and too many parameters', () => {
    expect(() => parseQuery('key=%ZZ')).toThrow('パーセント');
    expect(() => parseQuery('https://example.com/')).toThrow('クエリ');
    expect(() => parseQuery('https://[')).toThrow('URL');
    expect(() => parseQuery('&&')).toThrow('クエリ');
    expect(() => parseQuery(Array(2001).fill('a=b').join('&'))).toThrow('2,000');
  });
});
