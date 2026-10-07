import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useDeferredValue, useId, useMemo, useState } from 'react';
import { CodeEditor } from '../../components/common/CodeEditor';
import { CopyButton } from '../../components/common/CopyButton';
import { DownloadButton } from '../../components/common/DownloadButton';
import { ErrorNotice } from '../../components/common/ErrorNotice';
import { FileDropzone } from '../../components/common/FileDropzone';
import { ResetButton } from '../../components/common/ResetButton';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { useFileTask } from '../../hooks/useFileTask';
import { errorMessage } from '../../lib/errors';
import { readTextFile } from '../../lib/local-files';
import { MARKDOWN_SAMPLE, renderMarkdown } from './logic';
import styles from './styles.module.css';

export default function MarkdownPreview() {
  const errorId = useId();
  const [input, setInput] = useState('');
  const file = useFileTask((file) => readTextFile(file, ['.md', '.markdown', '.txt']), setInput);
  const deferred = useDeferredValue(input);
  const rendered = useMemo(() => {
    try {
      return { html: renderMarkdown(deferred), error: '' };
    } catch (error) {
      return { html: '', error: errorMessage(error) };
    }
  }, [deferred]);
  const updating = input !== deferred;
  const html = updating || file.busy || file.error ? '' : rendered.html;
  function edit(text: string) {
    file.cancel();
    setInput(text);
  }
  const undo = useToolUndo({ input, fileError: file.error }, (previous) => {
    setInput(previous.input);
    file.restoreError(previous.fileError);
  });
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>Markdownを入力</h2>
            <span>即時プレビュー</span>
          </div>
          <FileDropzone
            accept=".md,.markdown,.txt"
            hint="MD / Markdown / TXT · UTF-8 · 400 KB / 100,000文字まで"
            busy={file.busy}
            errorId={file.error ? errorId : undefined}
            onFiles={(files) => void file.run(files)}
          />
          <CodeEditor
            label="Markdown"
            value={input}
            onChange={(event) => edit(event.target.value)}
            rows={22}
            placeholder={'# タイトル\n\nここにMarkdownを入力…'}
            hint="100,000文字まで。表・チェックリスト・コードブロックに対応。"
            aria-invalid={!!rendered.error}
            aria-describedby={rendered.error && !updating && !file.error ? errorId : undefined}
          />
          <ErrorNotice message={file.error || (!updating ? rendered.error : '')} id={errorId} />
          <DownloadButton
            text={input}
            filename="document.md"
            type="text/markdown"
            disabled={!!rendered.error || updating || file.busy || !!file.error}
          />
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={() => edit(MARKDOWN_SAMPLE)}>
              サンプル
            </SampleButton>
            <ResetButton onClick={() => edit('')} />
          </div>
        </>
      }
      tips={
        <p>
          入力とプレビューを並べて確認できます。画像は読み込まず、Markdown画像の代替テキストを表示します。スクリプト・埋め込み・スタイルは除去します。HTMLコピーにも同じ安全化を適用します。リンクはクリック時に別タブで開きます。
        </p>
      }
    >
      <section className="panel">
        <div className="panel-heading">
          <h2>プレビュー</h2>
          <span>安全化済み</span>
        </div>
        <div className="result-actions">
          <CopyButton text={html} label="HTMLをコピー" />
        </div>
        {updating && <p role="status">プレビューを更新しています…</p>}
        {html ? (
          <article
            className={styles.preview}
            aria-label="Markdownのプレビュー"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className={styles.empty}>Markdownを入力するか、サンプルをお試しください。</div>
        )}
      </section>
    </ToolWorkspace>
  );
}
