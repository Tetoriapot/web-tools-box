import { useId, useState } from 'react';
import styles from './FileDropzone.module.css';

export function FileDropzone({
  accept,
  hint,
  busy = false,
  errorId,
  onFiles,
}: {
  accept: string;
  hint: string;
  busy?: boolean;
  errorId?: string;
  onFiles: (files: FileList) => void;
}) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  return (
    <div
      className={`${styles.zone} ${dragging ? styles.dragging : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        )
          setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        onFiles(event.dataTransfer.files);
      }}
    >
      <label htmlFor={id}>ファイルを選択、またはここにドロップ</label>
      <input
        id={id}
        type="file"
        accept={accept}
        aria-invalid={!!errorId}
        aria-describedby={[`${id}-hint`, errorId].filter(Boolean).join(' ')}
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <p id={`${id}-hint`} className="field-hint">
        {hint}
      </p>
      {busy && <p role="status">ファイルを読み込んでいます…</p>}
    </div>
  );
}
