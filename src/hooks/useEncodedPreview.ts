import { useEffect, useState } from 'react';
import { canvasBlob, canvasContext, type ImageFormat } from '../lib/canvas';
import { withRasterImage } from '../lib/raster';
import { errorMessage } from '../lib/errors';

type Encoded = {
  source: HTMLCanvasElement;
  format: ImageFormat;
  quality: number;
  canvas: HTMLCanvasElement | null;
  blob: Blob | null;
  error: string;
};

// Preview and download share the same encoded bytes. Old renders never become downloadable.
export function useEncodedPreview(
  source: HTMLCanvasElement | null,
  format: ImageFormat,
  quality: number,
) {
  const [result, setResult] = useState<Encoded | null>(null);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      if (!source) {
        setResult(null);
        return;
      }
      try {
        const blob = await canvasBlob(source, format, quality);
        if (!active) return;
        const bytes = new Uint8Array(await blob.arrayBuffer());
        if (!active) return;
        const canvas = await withRasterImage(
          bytes,
          `image/${format}`,
          (image) => {
            const output = canvasContext(image.naturalWidth, image.naturalHeight);
            output.context.drawImage(image, 0, 0);
            return output.canvas;
          },
          8192,
        );
        if (active) setResult({ source, format, quality, canvas, blob, error: '' });
      } catch (error) {
        if (active)
          setResult({
            source,
            format,
            quality,
            canvas: null,
            blob: null,
            error: errorMessage(error),
          });
      }
    }, 100);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [source, format, quality]);
  return source &&
    result?.source === source &&
    result.format === format &&
    result.quality === quality
    ? { canvas: result.canvas, blob: result.blob, error: result.error, busy: false }
    : { canvas: null, blob: null, error: '', busy: !!source };
}
