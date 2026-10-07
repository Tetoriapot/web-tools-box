import { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { canvasBlob, type ImageFormat } from '../../lib/canvas';
import { downloadBlob } from '../../lib/files';
import { errorMessage } from '../../lib/errors';
import { Button } from './Button';

export function ImageActions({
  canvas,
  format = 'png',
  quality = 0.92,
  filename,
  preparedBlob,
}: {
  canvas: HTMLCanvasElement | null;
  format?: ImageFormat;
  quality?: number;
  filename: string;
  preparedBlob?: Blob;
}) {
  const [busy, setBusy] = useState(false);
  const notify = useToast();
  async function save(copy: boolean) {
    if (!canvas || busy) return;
    setBusy(true);
    try {
      if (copy) {
        if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined')
          throw new Error('画像コピーに未対応です。画像を保存してください。');
        // Start the clipboard operation in the user gesture; encoding may complete later.
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': canvasBlob(canvas) })]);
        notify('画像をコピーしました');
      } else {
        downloadBlob(
          preparedBlob ?? (await canvasBlob(canvas, format, quality)),
          `${filename}.${format === 'jpeg' ? 'jpg' : format}`,
        );
        notify('保存を開始しました');
      }
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button variant="primary" disabled={!canvas || busy} onClick={() => void save(false)}>
        {busy ? '処理中…' : `${format.toUpperCase()}を保存`}
      </Button>
      <Button disabled={!canvas || busy} onClick={() => void save(true)}>
        画像をコピー
      </Button>
    </>
  );
}
