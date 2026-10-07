import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { canvasBlob } from '../../src/lib/canvas';
import { withRasterImage } from '../../src/lib/raster';
import { useEncodedPreview } from '../../src/hooks/useEncodedPreview';

vi.mock('../../src/lib/canvas', () => ({ canvasBlob: vi.fn() }));
vi.mock('../../src/lib/raster', () => ({ withRasterImage: vi.fn() }));
afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

it('invalidates the previous download immediately and ignores late encodes after change/reset', async () => {
  vi.useFakeTimers();
  const source = document.createElement('canvas');
  const decoded = document.createElement('canvas');
  const goodBlob = new Blob(['encoded'], { type: 'image/jpeg' });
  Object.defineProperty(goodBlob, 'arrayBuffer', { value: async () => new ArrayBuffer(1) });
  let finish!: (blob: Blob) => void;
  vi.mocked(canvasBlob)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue(goodBlob);
  vi.mocked(withRasterImage).mockResolvedValue(decoded);
  const hook = renderHook(({ canvas, quality }) => useEncodedPreview(canvas, 'jpeg', quality), {
    initialProps: { canvas: source as HTMLCanvasElement | null, quality: 0.9 },
  });
  await act(() => vi.advanceTimersByTimeAsync(100));
  hook.rerender({ canvas: source, quality: 0.3 });
  expect(hook.result.current.blob).toBeNull();
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(hook.result.current.blob).toBe(goodBlob);
  expect(hook.result.current.canvas).toBe(decoded);
  await act(async () => finish(new Blob(['stale'])));
  expect(hook.result.current.blob).toBe(goodBlob);
  hook.rerender({ canvas: null, quality: 0.3 });
  expect(hook.result.current).toEqual({ blob: null, canvas: null, error: '', busy: false });
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(hook.result.current.blob).toBeNull();
});

it('surfaces unsupported encoding without making stale content downloadable', async () => {
  vi.useFakeTimers();
  vi.mocked(canvasBlob).mockRejectedValue(new Error('WebPに未対応です。'));
  const canvas = document.createElement('canvas');
  const stable = renderHook(() => useEncodedPreview(canvas, 'webp', 0.9));
  await act(() => vi.advanceTimersByTimeAsync(100));
  expect(stable.result.current.error).toBe('WebPに未対応です。');
  expect(stable.result.current.blob).toBeNull();
  expect(stable.result.current.busy).toBe(false);
});
