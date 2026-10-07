import type { ReactNode } from 'react';

export function PreviewPanel({
  title = 'プレビュー',
  children,
  note,
}: {
  title?: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <section className="panel preview-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        {note && <span>{note}</span>}
      </div>
      {children}
    </section>
  );
}
