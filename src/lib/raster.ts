export type RasterMime = 'image/png' | 'image/jpeg' | 'image/webp';
export type RasterSize = { width: number; height: number };

// Read only size headers before decoding. The browser still validates the complete image.
// Unknown or incomplete headers return null rather than reading beyond the supplied buffer.
export function rasterSize(bytes: Uint8Array, mime: RasterMime): RasterSize | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (mime === 'image/png')
    return bytes.length >= 24 ? { width: view.getUint32(16), height: view.getUint32(20) } : null;
  if (mime === 'image/jpeg') {
    let offset = 2;
    while (offset < bytes.length) {
      if (bytes[offset] !== 0xff) return null;
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === undefined || marker === 0xda || marker === 0xd9) return null;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
      if (offset + 2 > bytes.length) return null;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) return null;
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
        return length >= 8
          ? { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) }
          : null;
      offset += length;
    }
    return null;
  }
  const ascii = (offset: number, word: string) =>
    [...word].every((letter, i) => bytes[offset + i] === letter.charCodeAt(0));
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const length = view.getUint32(offset + 4, true),
      data = offset + 8;
    if (data + length > bytes.length) return null;
    if (ascii(offset, 'VP8X') && length >= 10) {
      const uint24 = (at: number) => view.getUint16(at, true) + view.getUint8(at + 2) * 65536;
      return { width: uint24(data + 4) + 1, height: uint24(data + 7) + 1 };
    }
    if (ascii(offset, 'VP8L') && length >= 5 && bytes[data] === 0x2f) {
      const bits = view.getUint32(data + 1, true);
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    if (
      ascii(offset, 'VP8 ') &&
      length >= 10 &&
      bytes[data + 3] === 0x9d &&
      bytes[data + 4] === 0x01 &&
      bytes[data + 5] === 0x2a
    )
      return {
        width: view.getUint16(data + 6, true) & 0x3fff,
        height: view.getUint16(data + 8, true) & 0x3fff,
      };
    offset = data + length + (length % 2);
  }
  return null;
}

export function checkRasterSize({ width, height }: RasterSize, maxSide = Infinity) {
  if (!width || !height || width * height > 16_000_000)
    throw new Error('画像は縦横1px以上・1,600万画素以内にしてください。');
  if (width > maxSide || height > maxSide)
    throw new Error(`画像の各辺は${maxSide.toLocaleString()}px以内にしてください。`);
}

export async function withRasterImage<T>(
  bytes: Uint8Array,
  mime: RasterMime,
  read: (image: HTMLImageElement) => T,
  maxSide = Infinity,
): Promise<T> {
  const size = rasterSize(bytes, mime);
  if (size) checkRasterSize(size, maxSide);
  if (
    typeof URL.createObjectURL !== 'function' ||
    typeof URL.revokeObjectURL !== 'function' ||
    typeof Image !== 'function'
  )
    throw new Error('このブラウザでは画像を読み込めません。');
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mime }));
  let image: HTMLImageElement | undefined;
  try {
    const loaded = new Image();
    image = loaded;
    await new Promise<void>((resolve, reject) => {
      loaded.onload = () => resolve();
      loaded.onerror = () => reject(new Error('画像が破損しているか、読み込めない形式です。'));
      loaded.src = url;
    });
    checkRasterSize({ width: loaded.naturalWidth, height: loaded.naturalHeight }, maxSide);
    return read(loaded);
  } finally {
    if (image) {
      image.onload = null;
      image.onerror = null;
      image.src = '';
    }
    URL.revokeObjectURL(url);
  }
}
