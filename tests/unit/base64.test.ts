import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bytesToBase64,
  decodeBase64,
  decodeText,
  encodeText,
  MAX_BASE64_LENGTH,
} from '../../src/tools/base64-converter/logic';
import { imageMime, MAX_IMAGE_BYTES, readTextFile, validateFile } from '../../src/lib/local-files';

afterEach(() => vi.unstubAllGlobals());
describe('UTF-8 Base64', () => {
  it.each([
    ['f', 'Zg=='],
    ['fo', 'Zm8='],
    ['foo', 'Zm9v'],
    ['foobar', 'Zm9vYmFy'],
    ['こんにちは🌿', '44GT44KT44Gr44Gh44Gv8J+Mvw=='],
  ])('encodes and decodes %s', (text, base64) => {
    expect(encodeText(text, false)).toBe(base64);
    expect(decodeText(base64)).toBe(text);
    expect(decodeText(encodeText(text, true))).toBe(text);
  });
  it('supports whitespace and optional padding, preserves BOM and newlines', () => {
    expect(decodeText(' Zm\n9v\r ')).toBe('foo');
    expect(decodeText('Zg')).toBe('f');
    const text = '\uFEFF日本語\n ';
    expect(decodeText(encodeText(text, false))).toBe(text);
    expect(encodeText(' ', false)).toBe('IA==');
  });
  it.each([
    '?',
    'A',
    '====',
    'a=b=',
    'Zg=',
    'Zh==',
    'Zm9=',
    'Zm9v_',
    'data:text/html,hello',
    'data:text/plain;charset=shift_jis;base64,Zg==',
  ])('rejects malformed Base64 %s', (text) => {
    expect(() => decodeBase64(text)).toThrow();
  });
  it('enforces nonempty input, UTF-8 integrity and size limits', () => {
    expect(() => decodeText('/w==')).toThrow('UTF-8');
    expect(() => decodeText('AA==')).toThrow('バイナリ');
    expect(() => decodeBase64('')).toThrow('入力');
    expect(() => encodeText('', false)).toThrow('入力');
    expect(() => encodeText('\ud800', false)).toThrow('Unicode');
    expect(() => encodeText('a'.repeat(100_001), false)).toThrow('100,000');
    expect(() => decodeBase64('A'.repeat(MAX_BASE64_LENGTH + 1))).toThrow('2 MiB');
    expect(decodeText(encodeText('日'.repeat(100_000), false))).toHaveLength(100_000);
    expect(bytesToBase64(Uint8Array.from([0, 255, 128]))).toBe('AP+A');
  });
  it('reports missing browser APIs', () => {
    vi.stubGlobal('TextEncoder', undefined);
    expect(() => encodeText('x', false)).toThrow('ブラウザ');
    vi.stubGlobal('atob', undefined);
    expect(() => decodeText('Zg==')).toThrow('ブラウザ');
  });
});

describe('local file validation', () => {
  function textFile(name: string, bytes: Uint8Array) {
    const file = new File([new Uint8Array(bytes)], name);
    Object.defineProperty(file, 'arrayBuffer', { value: async () => bytes.buffer });
    return file;
  }
  it('reads only bounded UTF-8 text of the accepted extension', async () => {
    await expect(
      readTextFile(textFile('data.JSON', new TextEncoder().encode('{"日":1}')), ['.json']),
    ).resolves.toBe('{"日":1}');
    await expect(
      readTextFile(textFile('x.json', Uint8Array.from([255, 0])), ['.json']),
    ).rejects.toThrow('UTF-8');
    await expect(
      readTextFile(textFile('x.json', Uint8Array.from([0, 32])), ['.json']),
    ).rejects.toThrow('バイナリ');
    expect(() => validateFile(new File(['x'], 'bad.exe'), ['.json'], 10)).toThrow('対応');
    expect(() => validateFile(new File([], 'empty.json'), ['.json'], 10)).toThrow('空');
    expect(() => validateFile(new File(['123'], 'large.json'), ['.json'], 2)).toThrow('バイト');
    await expect(
      readTextFile(textFile('x.txt', new TextEncoder().encode('a'.repeat(100_001))), ['.txt']),
    ).rejects.toThrow('100,000');
    await expect(readTextFile(new File(['hi'], 'x.txt'), ['.txt'])).rejects.toThrow('ブラウザ');
  });
  it('identifies raster signatures rather than trusting a filename or MIME', () => {
    expect(imageMime(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe('image/png');
    expect(imageMime(Uint8Array.from([255, 216, 255, 0]))).toBe('image/jpeg');
    expect(imageMime(new TextEncoder().encode('RIFF1234WEBP'))).toBe('image/webp');
    expect(() => imageMime(new TextEncoder().encode('<svg/>'))).toThrow('画像データ');
    expect(() => imageMime(new Uint8Array(MAX_IMAGE_BYTES + 1))).toThrow('2 MiB');
  });
});
