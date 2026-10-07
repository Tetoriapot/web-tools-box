import { afterEach, describe, expect, it, vi } from 'vitest';
import { rasterSize, withRasterImage, type RasterMime } from '../../src/lib/raster';

afterEach(() => vi.unstubAllGlobals());
const headers: { name: string; mime: RasterMime; bytes: Uint8Array }[] = [
  {
    name: 'PNG',
    mime: 'image/png',
    bytes: Uint8Array.from(Buffer.from('89504e470d0a1a0a0000000d494844520000004000000030', 'hex')),
  },
  {
    name: 'JPEG with APP data and progressive SOF',
    mime: 'image/jpeg',
    bytes: Uint8Array.from(Buffer.from('ffd8ffe000040000ffffc2000b080030004001011100', 'hex')),
  },
  {
    name: 'WebP extended',
    mime: 'image/webp',
    bytes: Uint8Array.from(
      Buffer.from('524946461600000057454250565038580a000000000000003f00002f0000', 'hex'),
    ),
  },
  {
    name: 'WebP lossless',
    mime: 'image/webp',
    bytes: Uint8Array.from(
      Buffer.from('5249464612000000574542505650384c050000002f3fc00b0000', 'hex'),
    ),
  },
  {
    name: 'WebP lossy',
    mime: 'image/webp',
    bytes: Uint8Array.from(
      Buffer.from('524946461600000057454250565038200a0000000000009d012a40003000', 'hex'),
    ),
  },
];
describe('size preflight', () => {
  it.each(headers)('reads $name dimensions, including buffer views', ({ bytes, mime }) => {
    expect(rasterSize(bytes, mime)).toEqual({ width: 64, height: 48 });
    const padded = new Uint8Array(bytes.length + 20);
    padded.set(bytes, 7);
    expect(rasterSize(padded.subarray(7, 7 + bytes.length), mime)).toEqual({
      width: 64,
      height: 48,
    });
    for (let length = 0; length < bytes.length; length++)
      expect(() => rasterSize(bytes.subarray(0, length), mime)).not.toThrow();
  });
  it('skips unknown odd-length WebP chunks without treating padding as a header', () => {
    const extra = Uint8Array.from(Buffer.from('45584946010000000000', 'hex'));
    const bytes = new Uint8Array(headers[2]!.bytes.length + extra.length);
    bytes.set(headers[2]!.bytes.subarray(0, 12));
    bytes.set(extra, 12);
    bytes.set(headers[2]!.bytes.subarray(12), 22);
    expect(rasterSize(bytes, 'image/webp')).toEqual({ width: 64, height: 48 });
  });
  it('handles malformed segment lengths and markers without looping or reading beyond bounds', () => {
    for (const hex of [
      'ffd8ffe00000',
      'ffd8ffe0ffff',
      'ffd8ffda0008',
      'ffd8ffc0000300',
      'ffd8000000',
    ])
      expect(rasterSize(Uint8Array.from(Buffer.from(hex, 'hex')), 'image/jpeg')).toBeNull();
    const webp = headers[2]!.bytes.slice();
    new DataView(webp.buffer).setUint32(16, 0xffffffff, true);
    expect(rasterSize(webp, 'image/webp')).toBeNull();
  });
  it.each([
    { mime: 'image/png' as const, hex: '89504e470d0a1a0a0000000d494844520000200100000001' },
    { mime: 'image/jpeg' as const, hex: 'ffd8ffc0000b080001200101011100' },
    {
      mime: 'image/webp' as const,
      hex: '524946461600000057454250565038580a00000000000000002000000000',
    },
  ])('rejects oversized $mime before creating a URL or decoding', async ({ mime, hex }) => {
    const createObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() });
    await expect(
      withRasterImage(Uint8Array.from(Buffer.from(hex, 'hex')), mime, () => null, 8192),
    ).rejects.toThrow('8,192');
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});

describe('image resource lifetime', () => {
  it.each(['success', 'broken', 'oversize', 'processing failure', 'constructor failure'] as const)(
    'releases its URL after %s',
    async (mode) => {
      const revokeObjectURL = vi.fn();
      vi.stubGlobal('URL', { createObjectURL: () => 'blob:raster', revokeObjectURL });
      class MockImage {
        naturalWidth = mode === 'oversize' ? 8193 : 64;
        naturalHeight = 48;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor() {
          if (mode === 'constructor failure') throw new Error('constructor failure');
        }
        set src(value: string) {
          if (value) queueMicrotask(() => (mode === 'broken' ? this.onerror?.() : this.onload?.()));
        }
      }
      vi.stubGlobal('Image', MockImage);
      const result = withRasterImage(
        headers[0]!.bytes,
        'image/png',
        () => {
          if (mode === 'processing failure') throw new Error('processing failure');
          return 'read';
        },
        8192,
      );
      if (mode === 'success') await expect(result).resolves.toBe('read');
      else await expect(result).rejects.toThrow();
      expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:raster');
    },
  );
});
