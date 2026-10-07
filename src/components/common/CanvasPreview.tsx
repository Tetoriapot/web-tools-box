import { useEffect, useRef, type ReactNode } from 'react';
import { PreviewPanel } from './PreviewPanel';
import { ErrorNotice } from './ErrorNotice';
import styles from './CanvasPreview.module.css';

export function CanvasPreview({
  canvas,
  error,
  busy,
  children,
  empty = '画像を選択するか、サンプルをお試しください。',
}: {
  canvas: HTMLCanvasElement | null;
  error: string;
  busy: boolean;
  children?: ReactNode;
  empty?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!canvas || !host.current) return;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '出力画像のプレビュー');
    host.current.replaceChildren(canvas);
    return () => canvas.remove();
  }, [canvas]);
  return (
    <PreviewPanel note={canvas ? `${canvas.width} × ${canvas.height} px` : undefined}>
      <div className={styles.stage}>
        <div ref={host} className={styles.host} />
        {!canvas && (
          <p role={busy ? 'status' : undefined}>
            {busy ? 'プレビューを更新しています…' : error ? '入力内容を確認してください。' : empty}
          </p>
        )}
      </div>
      <ErrorNotice message={error} />
      {children && <div className={styles.actions}>{children}</div>}
    </PreviewPanel>
  );
}
