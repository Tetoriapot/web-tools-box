import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useState } from 'react';
import { Button } from '../../components/common/Button';
import { CodeEditor } from '../../components/common/CodeEditor';
import { ErrorNotice } from '../../components/common/ErrorNotice';
import { ResetButton } from '../../components/common/ResetButton';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { ResultPanel } from '../../components/tools/ResultPanel';
import { errorMessage } from '../../lib/errors';
import {
  decodeText,
  encodeText,
  parseQuery,
  urlSamples,
  type QueryEntry,
  type UrlMode,
} from './logic';

export default function UrlEncoder() {
  const [mode, setMode] = useState<UrlMode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [entries, setEntries] = useState<QueryEntry[]>([]);
  const [error, setError] = useState('');
  function clearResult() {
    setOutput('');
    setEntries([]);
    setError('');
  }
  function convert() {
    clearResult();
    try {
      if (mode === 'query') {
        const result = parseQuery(input);
        setEntries(result);
        setOutput(JSON.stringify(result, null, 2));
      } else setOutput(mode === 'encode' ? encodeText(input) : decodeText(input));
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  const undo = useToolUndo({ mode, input, output, entries, error }, (previous) => {
    setMode(previous.mode);
    setInput(previous.input);
    setOutput(previous.output);
    setEntries(previous.entries);
    setError(previous.error);
  });
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>入力と変換</h2>
          </div>
          <fieldset className="field">
            <legend>変換方法</legend>
            <div className="segmented compact-segments">
              {(
                [
                  { value: 'encode', label: 'エンコード' },
                  { value: 'decode', label: 'デコード' },
                  { value: 'query', label: 'クエリ解析' },
                ] as const
              ).map((option) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name="url-mode"
                    value={option.value}
                    checked={mode === option.value}
                    onChange={() => {
                      setMode(option.value);
                      clearResult();
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <CodeEditor
            label={mode === 'query' ? 'URLまたはクエリ文字列' : '変換するテキスト'}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              clearResult();
            }}
            rows={8}
            placeholder={mode === 'query' ? '?name=hello&color=green' : 'ここにテキストを入力…'}
            hint="100,000文字まで。入力内容は保存されません。"
            aria-invalid={!!error}
          />
          <Button variant="primary" className="full-width" onClick={convert}>
            {mode === 'query'
              ? 'クエリを解析'
              : mode === 'encode'
                ? 'エンコードする'
                : 'デコードする'}
          </Button>
          <ErrorNotice message={error} />
          <div className="secondary-actions">
            <SampleButton
              variant="quiet"
              onClick={() => {
                setInput(urlSamples[mode]);
                clearResult();
              }}
            >
              サンプル
            </SampleButton>
            <ResetButton
              onClick={() => {
                setMode('encode');
                setInput('');
                clearResult();
              }}
            />
          </div>
        </>
      }
      tips={
        <p>
          エンコード・デコードはURLの各パラメータ向けの変換です（encodeURIComponent /
          decodeURIComponent）。クエリ解析では重複するキーを保持し、「+」を空白として読み取ります。URLへのアクセスは行いません。
        </p>
      }
    >
      <ResultPanel
        text={output}
        filename={mode === 'query' ? 'query.json' : 'url-result.txt'}
        type={mode === 'query' ? 'application/json' : undefined}
        note={output ? `${output.length.toLocaleString()} 文字` : undefined}
        emptyMessage="テキストを入力して、変換ボタンを押してください。"
      />
      {entries.length > 0 && (
        <section className="panel query-panel">
          <div className="panel-heading">
            <h2>クエリの内訳</h2>
            <span>{entries.length} 件</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">キー</th>
                  <th scope="col">値</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.key || '（空）'}</td>
                    <td>{entry.value || '（空）'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </ToolWorkspace>
  );
}
