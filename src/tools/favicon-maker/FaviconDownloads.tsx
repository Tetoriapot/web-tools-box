import { useState } from 'react';
import { Button } from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { errorMessage } from '../../lib/errors';
import { downloadBlob } from '../../lib/files';
import { canvasBlob } from '../../lib/canvas';
import { faviconFiles, faviconSizes, faviconZip, sizedIcon } from './logic';

export function FaviconDownloads({ canvas }: { canvas: HTMLCanvasElement | null }) {
  const [busy, setBusy] = useState(false);
  const notify = useToast();
  async function save(kind: 'zip' | 'ico' | number) {
    if (!canvas || busy) return;
    setBusy(true);
    try {
      const blob =
        kind === 'zip'
          ? await faviconZip(canvas)
          : kind === 'ico'
            ? new Blob([new Uint8Array((await faviconFiles(canvas)).get('favicon.ico')!)], {
                type: 'image/vnd.microsoft.icon',
              })
            : await canvasBlob(sizedIcon(canvas, kind));
      downloadBlob(
        blob,
        kind === 'zip' ? 'favicons.zip' : kind === 'ico' ? 'favicon.ico' : `favicon-${kind}.png`,
      );
      notify('保存を開始しました');
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button variant="primary" disabled={!canvas || busy} onClick={() => void save('zip')}>
        {busy ? '書き出しています…' : '一式をZIPで保存'}
      </Button>
      <Button disabled={!canvas || busy} onClick={() => void save('ico')}>
        ICOを保存
      </Button>
      {faviconSizes.map((size) => (
        <Button key={size} disabled={!canvas || busy} onClick={() => void save(size)}>
          {size}px PNG
        </Button>
      ))}
    </>
  );
}
