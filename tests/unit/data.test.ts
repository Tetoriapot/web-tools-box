import { describe, expect, it } from 'vitest';
import { assertJsonValue, parseJson } from '../../src/lib/json';
import { filterRows, jsonRows } from '../../src/tools/json-visualizer/logic';
import { convertData } from '../../src/tools/json-yaml-converter/logic';

describe('JSON validation and tree', () => {
  it.each(['null', 'false', '0', '"日本語"', '[]', '{}'])('accepts JSON root %s', (text) => {
    expect(parseJson(text)).toEqual(JSON.parse(text));
  });
  it('reports syntax lines and size/depth/node/numeric limits', () => {
    expect(() => parseJson('{\n"x":1,}')).toThrow('2行目');
    expect(() => parseJson('{\n"x":] }')).toThrow('構文エラー');
    expect(() => parseJson('')).toThrow('入力');
    expect(() => parseJson(' '.repeat(100_000) + '0')).toThrow('100,000');
    expect(() => parseJson('['.repeat(42) + '0' + ']'.repeat(42))).toThrow('40');
    expect(() => parseJson(JSON.stringify(Array(10_001).fill(0)))).toThrow('10,000');
    expect(() => parseJson('1e400')).toThrow('数値');
    expect(() => parseJson('9007199254740993')).toThrow('文字列');
    expect(parseJson('"9007199254740993"')).toBe('9007199254740993');
  });
  it('keeps escaped keys and prototype-like keys as data', () => {
    const data = parseJson(
      JSON.stringify({ 'a.b': [{ 'x"y': 1 }], ['__proto__']: { polluted: true } }),
    );
    const rows = jsonRows(data);
    expect(rows.map((row) => row.path)).toContain(`$["a.b"][0][${JSON.stringify('x"y')}]`);
    expect(rows.map((row) => row.path)).toContain('$["__proto__"]["polluted"]');
    expect(Object.prototype).not.toHaveProperty('polluted');
  });
  it('collapses descendants and includes ancestors of case-insensitive matches', () => {
    const rows = jsonRows({ tools: [{ name: 'one' }, { title: 'two' }], name: 'root' });
    expect(filterRows(rows, '', new Set(['$["tools"]'])).rows.map((row) => row.path)).toEqual([
      '$',
      '$["tools"]',
      '$["name"]',
    ]);
    const result = filterRows(rows, 'NAME', new Set(['$']));
    expect(result.matches).toBe(2);
    expect(result.rows.map((row) => row.path)).toEqual([
      '$',
      '$["tools"]',
      '$["tools"][0]',
      '$["tools"][0]["name"]',
      '$["name"]',
    ]);
    expect(filterRows(rows, 'missing', new Set()).rows).toEqual([]);
  });
  it('rejects cyclic or incompatible values without recursing forever', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(() => assertJsonValue(circular)).toThrow('循環');
    expect(() => assertJsonValue(new Date())).toThrow('オブジェクト');
    expect(() => assertJsonValue(undefined)).toThrow('値');
  });
});

describe('JSON / YAML conversion', () => {
  it('round-trips Unicode, null, scalars, nested arrays and string keys', () => {
    const text =
      '{"日本語":"🌿","on":"yes","date":"2026-10-03","items":[null,false,1.5],"__proto__":{"x":1}}';
    const yaml = convertData(text, 'json-yaml');
    expect(JSON.parse(convertData(yaml, 'yaml-json'))).toEqual(JSON.parse(text));
    for (const root of ['null', 'false', '0', '"text"', '[]'])
      expect(JSON.parse(convertData(convertData(root, 'json-yaml'), 'yaml-json'))).toEqual(
        JSON.parse(root),
      );
  });
  it('uses YAML 1.2 core semantics and supports bounded aliases', () => {
    expect(
      JSON.parse(
        convertData('date: 2026-10-03\non: yes\nbase: &base [1, 2]\ncopy: *base\n', 'yaml-json'),
      ),
    ).toEqual({ date: '2026-10-03', on: 'yes', base: [1, 2], copy: [1, 2] });
  });
  it.each([
    ['a: 1\na: 2', 'YAML'],
    ['a: [broken', 'YAML'],
    ['1: value', '文字列'],
    ['? [a, b]\n: value', '文字列'],
    ['x: .nan', '数値'],
    ['x: .inf', '数値'],
    ['x: !custom hello', 'YAML'],
    ['x: &loop [*loop]', '循環'],
    ['x: *missing', 'エイリアス'],
    ['a: 1\n---\nb: 2', 'YAML'],
  ])('rejects non-JSON or invalid YAML: %s', (text, error) => {
    expect(() => convertData(text, 'yaml-json')).toThrow(error);
  });
  it('bounds alias amplification and deeply nested input', () => {
    const bomb =
      'a: &a [1,2,3]\nb: &b [*a,*a,*a,*a,*a,*a,*a,*a]\nc: &c [*b,*b,*b,*b,*b,*b,*b,*b]\nd: [*c,*c,*c,*c,*c,*c,*c,*c]';
    expect(() => convertData(bomb, 'yaml-json')).toThrow('エイリアス');
    expect(() => convertData('['.repeat(45) + '0' + ']'.repeat(45), 'yaml-json')).toThrow('40');
  });
});
