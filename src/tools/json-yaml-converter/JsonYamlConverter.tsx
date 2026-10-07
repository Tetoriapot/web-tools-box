import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useId, useState } from 'react';
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
import { readTextFile } from '../../lib/local-files';
import { conversionSamples, convertData, type ConversionMode } from './logic';

export default function JsonYamlConverter() {
  const errorId = useId();
  const [mode, setMode] = useState<ConversionMode>('json-yaml');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const jsonInput = mode === 'json-yaml';
  const file = useFileTask(
    (file) => readTextFile(file, jsonInput ? ['.json', '.txt'] : ['.yaml', '.yml', '.txt']),
    setInput,
  );
  function clear() {
    file.cancel();
    setOutput('');
    setError('');
  }
  function edit(text: string) {
    clear();
    setInput(text);
  }
  function convert() {
    clear();
    try {
      setOutput(convertData(input, mode));
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  const undo = useToolUndo({ mode, input, output, error, fileError: file.error }, (previous) => {
    setMode(previous.mode);
    setInput(previous.input);
    setOutput(previous.output);
    setError(previous.error);
    file.restoreError(previous.fileError);
  });
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>入力と変換</h2>
          </div>
          <OptionGroup
            label="変換方向"
            value={mode}
            onChange={(mode) => {
              setMode(mode);
              edit('');
            }}
            options={[
              { id: 'json-yaml', label: 'JSON → YAML' },
              { id: 'yaml-json', label: 'YAML → JSON' },
            ]}
          />
          <FileDropzone
            accept={jsonInput ? '.json,.txt' : '.yaml,.yml,.txt'}
            hint={`${jsonInput ? 'JSON' : 'YAML / YML'} / TXT · UTF-8 · 400 KB / 100,000文字まで`}
            busy={file.busy}
            errorId={file.error ? errorId : undefined}
            onFiles={(files) => {
              clear();
              void file.run(files);
            }}
          />
          <CodeEditor
            label={jsonInput ? 'JSON' : 'YAML'}
            value={input}
            onChange={(event) => edit(event.target.value)}
            rows={14}
            placeholder={jsonInput ? '{ "name": "Web Tools Box" }' : 'name: Web Tools Box'}
            hint="100,000文字・10,000項目・40階層まで。"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
          <Button variant="primary" className="full-width" disabled={file.busy} onClick={convert}>
            {jsonInput ? 'YAML' : 'JSON'}に変換
          </Button>
          <ErrorNotice message={error || file.error} id={errorId} />
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={() => edit(conversionSamples[mode])}>
              サンプル
            </SampleButton>
            <ResetButton
              onClick={() => {
                setMode('json-yaml');
                edit('');
              }}
            />
          </div>
          <Button
            disabled={!output}
            onClick={() => {
              const next = output;
              setMode(jsonInput ? 'yaml-json' : 'json-yaml');
              edit(next);
            }}
          >
            結果を入力にして逆変換
          </Button>
        </>
      }
      tips={
        <p>
          YAML
          1.2に対応します。JSONに表せる値だけを変換し、コメント・書式は引き継ぎません。重複キー、循環参照、文字列以外のキー、非有限数はエラーでお知らせします。
        </p>
      }
    >
      <ResultPanel
        text={output}
        title={jsonInput ? 'YAML' : 'JSON'}
        filename={jsonInput ? 'converted.yaml' : 'converted.json'}
        type={jsonInput ? 'application/yaml' : 'application/json'}
      />
    </ToolWorkspace>
  );
}
