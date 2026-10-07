import { CopyButton } from '../common/CopyButton';
import { DownloadButton } from '../common/DownloadButton';
import { CodeEditor } from '../common/CodeEditor';
import type { ReactNode } from 'react';

export function ResultPanel({
  text,
  filename,
  title = '結果',
  note,
  type,
  toolbar,
  emptyMessage = '入力すると、ここに結果が表示されます。',
}: {
  text: string;
  filename: string;
  title?: string;
  note?: string;
  type?: string;
  toolbar?: ReactNode;
  emptyMessage?: string;
}) {
  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        {note && <span>{note}</span>}
      </div>
      {toolbar}
      <CodeEditor
        label={title === '結果' ? '出力結果' : `生成された${title}`}
        value={text}
        readOnly
        rows={7}
        placeholder={emptyMessage}
      />
      <div className="result-actions">
        <CopyButton text={text} label={title === '結果' ? '結果をコピー' : `${title}をコピー`} />
        <DownloadButton text={text} filename={filename} type={type} />
      </div>
    </section>
  );
}
