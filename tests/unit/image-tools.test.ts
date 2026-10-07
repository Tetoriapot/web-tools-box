import { afterEach, describe, expect, it, vi } from 'vitest';
import { canvasBlob, dimensions, fitRect } from '../../src/lib/canvas';
import { targetSize } from '../../src/lib/image-transform';
import { decorationSize } from '../../src/tools/screenshot-decorator/logic';
import { codeLines } from '../../src/tools/code-shot/logic';
import { defaultQr, qrData, qrSvg } from '../../src/tools/qr-code-maker/logic';
import { faviconManifest, icoFromPng } from '../../src/tools/favicon-maker/logic';
import { defaultOgp, validateOgp } from '../../src/tools/ogp-image-maker/logic';
import { fittedText, graphemes, wrapText } from '../../src/lib/canvas-text';

afterEach(() => vi.unstubAllGlobals());
describe('image geometry', () => {
  it.each([
    [0, 100],
    [100, 0],
    [8193, 1],
    [4001, 4000],
    [1.5, 1],
    [NaN, 1],
    [Infinity, 1],
  ])('rejects unsafe dimensions %s × %s', (width, height) => {
    expect(() => dimensions(width, height)).toThrow('サイズ');
  });
  it('accepts exact boundaries and fits or crops around the center', () => {
    expect(dimensions(4000, 4000)).toEqual({ width: 4000, height: 4000 });
    const source = { width: 800, height: 400 },
      box = { width: 200, height: 200 };
    expect(fitRect(source, box, 'contain')).toEqual({ x: 0, y: 50, width: 200, height: 100 });
    expect(fitRect(source, box, 'cover')).toEqual({ x: -100, y: 0, width: 400, height: 200 });
    expect(fitRect(source, box, 'stretch')).toEqual({ x: 0, y: 0, width: 200, height: 200 });
    expect(targetSize(source, '200', '200', null, 'fit')).toEqual({ width: 200, height: 100 });
    expect(targetSize(source, '200', '200', null, 'contain')).toEqual(box);
    expect(targetSize(source, '', '', '50', 'fit')).toEqual({ width: 400, height: 200 });
  });
  it.each(['', '0', '-1', '0.001', '401', 'Infinity', 'abc'])(
    'rejects invalid percentage %s',
    (percent) => {
      expect(() => targetSize({ width: 800, height: 500 }, '100', '100', percent, 'fit')).toThrow(
        '倍率',
      );
    },
  );
  it('allows tiny positive percentages and rejects oversized output', () => {
    expect(targetSize({ width: 8, height: 4 }, '', '', '0.1', 'fit')).toEqual({
      width: 1,
      height: 1,
    });
    expect(() => targetSize({ width: 4000, height: 4000 }, '', '', '200', 'fit')).toThrow('サイズ');
    expect(() => targetSize({ width: 8, height: 4 }, '', '100', null, 'fit')).toThrow('サイズ');
  });
  it('pads screenshots, limits the source long side and honors each ratio', () => {
    expect(decorationSize({ width: 800, height: 500 }, 64, 'auto')).toEqual({
      width: 928,
      height: 628,
    });
    expect(decorationSize({ width: 800, height: 500 }, 64, '1:1')).toEqual({
      width: 928,
      height: 928,
    });
    expect(decorationSize({ width: 800, height: 500 }, 64, '16:9')).toEqual({
      width: 1120,
      height: 630,
    });
    expect(decorationSize({ width: 4000, height: 2500 }, 64, 'auto')).toEqual({
      width: 1728,
      height: 1128,
    });
    expect(decorationSize({ width: 8192, height: 1 }, 64, 'auto')).toEqual({
      width: 1728,
      height: 129,
    });
    expect(decorationSize({ width: 800, height: 500 }, 64, '4:3')).toEqual({
      width: 928,
      height: 696,
    });
  });
});

describe('image encoding', () => {
  function mockCanvas(blob: Blob | null) {
    return { toBlob: (callback: BlobCallback) => callback(blob) } as HTMLCanvasElement;
  }
  it('rejects null and browser format fallback instead of mislabeling a PNG', async () => {
    await expect(canvasBlob(mockCanvas(null))).rejects.toThrow('失敗');
    await expect(
      canvasBlob(mockCanvas(new Blob(['png'], { type: 'image/png' })), 'webp'),
    ).rejects.toThrow('未対応');
    await expect(
      canvasBlob(mockCanvas(new Blob(['jpeg'], { type: 'image/jpeg' })), 'jpeg'),
    ).resolves.toHaveProperty('type', 'image/jpeg');
    await expect(canvasBlob({} as HTMLCanvasElement)).rejects.toThrow('ブラウザ');
    expect(() => canvasBlob(mockCanvas(null), 'png', NaN)).toThrow('品質');
  });
});

describe('text layout boundaries', () => {
  it('handles newline normalization, tab stops, empty and large code', () => {
    expect(codeLines('one\r\n\ttwo')).toEqual(['one', '    two']);
    expect(() => codeLines(' ')).toThrow('入力');
    expect(() => codeLines('x'.repeat(10001))).toThrow('10,000');
    expect(() => codeLines('x\n'.repeat(120))).toThrow('120行');
  });
  it('keeps combined emojis intact when wrapping', () => {
    expect(graphemes('👩‍💻🇯🇵')).toEqual(['👩‍💻', '🇯🇵']);
    const context = {
      font: '',
      measureText: (text: string) => ({ width: graphemes(text).length * 10 }),
    } as CanvasRenderingContext2D;
    expect(wrapText(context, '👩‍💻日本語\n次', 20)).toEqual(['👩‍💻日', '本語', '次']);
    expect(() => fittedText(context, '長'.repeat(20), 20, 2, 64, 34)).toThrow('収まりません');
  });
  it('bounds OGP content and validates colors', () => {
    expect(validateOgp(defaultOgp).background).toBe('#f2f5ec');
    expect(() => validateOgp({ ...defaultOgp, title: '' })).toThrow('タイトル');
    expect(() => validateOgp({ ...defaultOgp, subtitle: 'x'.repeat(181) })).toThrow('180');
    expect(() => validateOgp({ ...defaultOgp, foreground: 'red;anything' })).toThrow('HEX');
  });
});

describe('QR validation and safe vector output', () => {
  it('creates bounded matrices and does not embed user markup in SVG', () => {
    const result = qrData('日本語 🌿', defaultQr);
    expect(result.modules).toBeGreaterThanOrEqual(21);
    expect(result.total).toBe(result.modules + 8);
    const svg = qrSvg('<script>alert(1)</script>', defaultQr);
    expect(svg).not.toContain('<script>');
    const xml = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(xml.querySelector('parsererror')).toBeNull();
    expect(xml.documentElement.getAttribute('width')).toBe('320');
    expect(xml.querySelectorAll('rect,path')).toHaveLength(2);
  });
  it.each(['', '128.5', '0', '2049'])('rejects invalid QR size %s', (size) => {
    expect(() => qrData('hello', { ...defaultQr, size })).toThrow('サイズ');
  });
  it('refuses empty/too large input, low contrast and too-small modules', () => {
    expect(() => qrData('', defaultQr)).toThrow('入力');
    expect(() => qrData('日'.repeat(501), defaultQr)).toThrow('1,500');
    expect(() => qrData('a', { ...defaultQr, foreground: '#fff' })).toThrow('明暗差');
    expect(() => qrData('a', { ...defaultQr, margin: 0 })).toThrow('余白');
    expect(() => qrData('a'.repeat(1500), { ...defaultQr, size: '128' })).toThrow('サイズ');
  });
});

describe('favicon container', () => {
  it('writes multi-resolution ICO headers, byte lengths and offsets', () => {
    const entries = [
      { size: 16, bytes: Uint8Array.of(1, 2, 3) },
      { size: 32, bytes: Uint8Array.of(4, 5) },
    ];
    const ico = icoFromPng(entries),
      view = new DataView(ico.buffer);
    expect(view.getUint16(0, true)).toBe(0);
    expect(view.getUint16(2, true)).toBe(1);
    expect(view.getUint16(4, true)).toBe(2);
    expect(view.getUint8(6)).toBe(16);
    expect(view.getUint8(22)).toBe(32);
    expect(view.getUint32(14, true)).toBe(3);
    expect(view.getUint32(18, true)).toBe(38);
    expect(view.getUint32(34, true)).toBe(41);
    expect([...ico.slice(38)]).toEqual([1, 2, 3, 4, 5]);
    expect(() => icoFromPng([{ size: 512, bytes: Uint8Array.of(1) }])).toThrow('サイズ');
    expect(
      JSON.parse(faviconManifest).icons.map((entry: { sizes: string }) => entry.sizes),
    ).toEqual(['192x192', '512x512']);
  });
});
