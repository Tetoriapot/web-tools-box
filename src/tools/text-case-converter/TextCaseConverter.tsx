import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useState } from 'react';
import { CodeEditor } from '../../components/common/CodeEditor';
import { ErrorNotice } from '../../components/common/ErrorNotice';
import { ResetButton } from '../../components/common/ResetButton';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { ResultPanel } from '../../components/tools/ResultPanel';
import { errorMessage } from '../../lib/errors';
import { caseFormats, convertCase, textSample, type CaseFormat } from './logic';

export default function TextCaseConverter() {
  const [input, setInput] = useState('');
  const [format, setFormat] = useState<CaseFormat>('camel');
  let output = '';
  let error = '';
  if (input) {
    try {
      output = convertCase(input, format);
    } catch (cause) {
      error = errorMessage(cause);
    }
  }
  const undo = useToolUndo({ input, format }, (previous) => {
    setInput(previous.input);
    setFormat(previous.format);
  });
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>テキスト入力</h2>
            <span>リアルタイム変換</span>
          </div>
          <CodeEditor
            label="変換するテキスト"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={8}
            placeholder="hello world"
            hint="1行ずつ変換します。100,000文字まで。"
            aria-invalid={!!error}
          />
          <fieldset className="field">
            <legend>変換するケース</legend>
            <div className="case-options">
              {caseFormats.map((option) => (
                <label key={option.id}>
                  <input
                    type="radio"
                    name="text-case"
                    checked={format === option.id}
                    onChange={() => setFormat(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <ErrorNotice message={error} />
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={() => setInput(textSample)}>
              サンプル
            </SampleButton>
            <ResetButton
              onClick={() => {
                setInput('');
                setFormat('camel');
              }}
            />
          </div>
        </>
      }
      tips={
        <p>
          空白、記号、ハイフン、アンダースコア、大文字の切り替わりを単語の区切りとして扱います。日本語など大文字・小文字を持たない文字は保持します。複数行の名前もまとめて変換できます。
        </p>
      }
    >
      <ResultPanel
        text={output}
        filename="converted-text.txt"
        note={caseFormats.find((option) => option.id === format)?.label}
      />
    </ToolWorkspace>
  );
}
