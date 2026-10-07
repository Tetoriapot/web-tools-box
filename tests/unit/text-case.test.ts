import { describe, expect, it } from 'vitest';
import {
  caseFormats,
  convertCase,
  splitWords,
  type CaseFormat,
} from '../../src/tools/text-case-converter/logic';

describe('text case conversion', () => {
  it.each<[CaseFormat, string]>([
    ['camel', 'helloWorld'],
    ['pascal', 'HelloWorld'],
    ['snake', 'hello_world'],
    ['kebab', 'hello-world'],
    ['constant', 'HELLO_WORLD'],
    ['title', 'Hello World'],
  ])('converts %s', (format, expected) => {
    expect(convertCase('hello world', format)).toBe(expected);
  });
  it('handles acronyms, existing cases, repeated separators and per-line conversion', () => {
    expect(splitWords('XMLHttpRequest')).toEqual(['XML', 'Http', 'Request']);
    expect(convertCase('XMLHttpRequest\r\nhello___world\n\nCSSStyle', 'snake')).toBe(
      'xml_http_request\nhello_world\n\ncss_style',
    );
    expect(convertCase('version2 Value', 'camel')).toBe('version2Value');
  });
  it('preserves Unicode letters and combining marks', () => {
    expect(convertCase('日本語 テキスト', 'snake')).toBe('日本語_テキスト');
    expect(convertCase('cafe\u0301 日本', 'snake')).toBe('café_日本');
  });
  it('rejects empty, punctuation-only and oversized inputs', () => {
    expect(() => convertCase('', 'camel')).toThrow('入力');
    expect(() => convertCase('---! 🧰', 'camel')).toThrow('文字や数字');
    expect(() => convertCase('a'.repeat(100_001), 'camel')).toThrow('100,000');
  });
  it('handles the full input limit for all six formats', () => {
    const text = 'hello world '.repeat(8333);
    for (const format of caseFormats)
      expect(convertCase(text, format.id).length).toBeGreaterThan(0);
  });
});
