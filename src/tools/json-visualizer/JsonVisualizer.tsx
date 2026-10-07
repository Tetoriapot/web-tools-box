import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useId, useMemo, useState } from 'react';
import { Button } from '../../components/common/Button';
import { CodeEditor } from '../../components/common/CodeEditor';
import { ErrorNotice } from '../../components/common/ErrorNotice';
import { FileDropzone } from '../../components/common/FileDropzone';
import { OptionGroup } from '../../components/common/OptionGroup';
import { ResetButton } from '../../components/common/ResetButton';
import { ResultPanel } from '../../components/tools/ResultPanel';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { useFileTask } from '../../hooks/useFileTask';
import { errorMessage } from '../../lib/errors';
import { parseJson, type JsonValue } from '../../lib/json';
import { readTextFile } from '../../lib/local-files';
import { JSON_SAMPLE, jsonRows } from './logic';
import { JsonTree } from './JsonTree';

export default function JsonVisualizer() {
  const errorId = useId();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ value: JsonValue; revision: number } | null>(null);
  const [format, setFormat] = useState<'pretty' | 'compact'>('pretty');
  const [error, setError] = useState('');
  const file = useFileTask(
    (file) => readTextFile(file, ['.json', '.txt']),
    (text) => setInput(text),
  );
  const rows = useMemo(() => (result ? jsonRows(result.value) : []), [result]);
  function edit(text: string) {
    file.cancel();
    setInput(text);
    setResult(null);
    setError('');
  }
  function analyze() {
    file.cancel();
    setResult(null);
    setError('');
    try {
      setResult({ value: parseJson(input), revision: Date.now() });
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  const output = result
    ? JSON.stringify(result.value, null, format === 'pretty' ? 2 : undefined)
    : '';
  const undo = useToolUndo({ input, result, format, error, fileError: file.error }, (previous) => {
    setInput(previous.input);
    setResult(previous.result);
    setFormat(previous.format);
    setError(previous.error);
    file.restoreError(previous.fileError);
  });
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>JSONを入力</h2>
          </div>
          <FileDropzone
            accept=".json,.txt,application/json"
            hint="JSON / TXT · UTF-8 · 400 KB / 100,000文字まで"
            busy={file.busy}
            errorId={file.error ? errorId : undefined}
            onFiles={(files) => {
              setError('');
              setResult(null);
              void file.run(files);
            }}
          />
          <CodeEditor
            label="JSON"
            value={input}
            onChange={(event) => edit(event.target.value)}
            rows={14}
            placeholder={'{\n  "name": "Web Tools Box"\n}'}
            hint="100,000文字・10,000項目・40階層まで。"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
          <Button variant="primary" className="full-width" disabled={file.busy} onClick={analyze}>
            検証して表示
          </Button>
          <ErrorNotice message={error || file.error} id={errorId} />
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={() => edit(JSON_SAMPLE)}>
              サンプル
            </SampleButton>
            <ResetButton
              onClick={() => {
                edit('');
                setFormat('pretty');
              }}
            />
          </div>
        </>
      }
      tips={
        <p>
          JSONを貼り付けて「検証して表示」を押すと、整形・圧縮とツリー表示を利用できます。キー検索は大文字・小文字を区別しません。数値の精度を保つため、安全な整数範囲を超えるIDは文字列にしてください。
        </p>
      }
    >
      <ResultPanel
        text={output}
        filename="formatted.json"
        title="JSON"
        type="application/json"
        note={result ? '構文は有効です' : undefined}
        toolbar={
          <OptionGroup
            label="出力形式"
            value={format}
            onChange={setFormat}
            options={[
              { id: 'pretty', label: '整形' },
              { id: 'compact', label: '圧縮' },
            ]}
          />
        }
      />
      {result && <JsonTree key={result.revision} rows={rows} />}
    </ToolWorkspace>
  );
}
