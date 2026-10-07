import { afterEach, expect, it, vi } from 'vitest';
import { validateRaster } from '../../src/lib/local-files';

afterEach(() => vi.unstubAllGlobals());
const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

it.each(['success', 'broken', 'oversized'] as const)(
  'releases image Object URLs after %s',
  async (mode) => {
    const createObjectURL = vi.fn().mockReturnValue('blob:local-image');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    class MockImage {
      naturalWidth = mode === 'oversized' ? 4001 : 64;
      naturalHeight = mode === 'oversized' ? 4000 : 48;
      onload?: () => void;
      onerror?: () => void;
      set src(value: string) {
        if (value) queueMicrotask(() => (mode === 'broken' ? this.onerror?.() : this.onload?.()));
      }
    }
    vi.stubGlobal('Image', MockImage);
    if (mode === 'success')
      await expect(validateRaster(png)).resolves.toEqual({
        mime: 'image/png',
        width: 64,
        height: 48,
      });
    else await expect(validateRaster(png)).rejects.toThrow(mode === 'broken' ? '破損' : '画素');
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:local-image');
  },
);

it('explains when raster APIs are unavailable', async () => {
  vi.stubGlobal('URL', {});
  await expect(validateRaster(png)).rejects.toThrow('ブラウザ');
});
