import { useEffect, useState } from 'react';
import { errorMessage } from '../lib/errors';

type Draw = () => HTMLCanvasElement | null;
type Rendered = { draw: Draw; canvas: HTMLCanvasElement | null; error: string };

export function useCanvasPreview(draw: Draw) {
  const [result, setResult] = useState<Rendered | null>(null);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        if (document.fonts) await document.fonts.ready;
        if (active) setResult({ draw, canvas: draw(), error: '' });
      } catch (error) {
        if (active) setResult({ draw, canvas: null, error: errorMessage(error) });
      }
    }, 60);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [draw]);
  return result?.draw === draw
    ? { canvas: result.canvas, error: result.error, busy: false }
    : { canvas: null, error: '', busy: true };
}
