import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useState } from 'react';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { ResultPanel } from '../../components/tools/ResultPanel';
import { Button } from '../../components/common/Button';
import { ResetButton } from '../../components/common/ResetButton';
import { ErrorNotice } from '../../components/common/ErrorNotice';
import { errorMessage } from '../../lib/errors';
import { formatUuids, generateUuids, parseCount, sampleUuids, type UuidFormat } from './logic';

export default function UuidGenerator() {
  const [count, setCount] = useState('5');
  const [format, setFormat] = useState<UuidFormat>('lines');
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [sample, setSample] = useState(false);
  function generate() {
    try {
      setIds(generateUuids(parseCount(count)));
      setSample(false);
      setError('');
    } catch (error) {
      setIds([]);
      setError(errorMessage(error));
    }
  }
  function reset() {
    setCount('5');
    setFormat('lines');
    setIds([]);
    setError('');
    setSample(false);
  }
  const undo = useToolUndo({ count, format, ids, error, sample }, (previous) => {
    setCount(previous.count);
    setFormat(previous.format);
    setIds(previous.ids);
    setError(previous.error);
    setSample(previous.sample);
  });
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>生成設定</h2>
            <span>UUID v4</span>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              generate();
            }}
            noValidate
          >
            <div className="field">
              <label htmlFor="uuid-count">生成数</label>
              <div className="number-control">
                <input
                  id="uuid-count"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={count}
                  onChange={(event) => {
                    setCount(event.target.value);
                    setError('');
                  }}
                  aria-invalid={!!error}
                  aria-describedby="uuid-count-hint uuid-error"
                />
                <span>件</span>
              </div>
              <p className="field-hint" id="uuid-count-hint">
                1〜100件をまとめて生成できます。
              </p>
            </div>
            <fieldset className="field">
              <legend>出力形式</legend>
              <div className="segmented">
                {(
                  [
                    { value: 'lines', label: '改行区切り' },
                    { value: 'csv', label: 'CSV' },
                  ] as const
                ).map((option) => (
                  <label key={option.value}>
                    <input
                      type="radio"
                      name="uuid-format"
                      value={option.value}
                      checked={format === option.value}
                      onChange={() => setFormat(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Button type="submit" variant="primary" className="full-width">
              UUIDを生成
            </Button>
            <ErrorNotice message={error} id="uuid-error" />
          </form>
          <div className="secondary-actions">
            <SampleButton
              variant="quiet"
              onClick={() => {
                setCount('3');
                setIds([...sampleUuids]);
                setError('');
                setSample(true);
              }}
            >
              サンプル
            </SampleButton>
            <ResetButton onClick={reset} />
          </div>
          <div className="inline-note">
            暗号学的に安全な乱数を使用します。
            <br />
            生成したIDはこの画面だけに保持されます。
          </div>
        </>
      }
      tips={
        <p>
          生成数と区切り形式を選び、「UUIDを生成」を押してください。サンプルは固定値です。実際に使用するIDは生成ボタンから作成してください。
        </p>
      }
    >
      <ResultPanel
        text={formatUuids(ids, format)}
        filename={format === 'csv' ? 'uuids.csv' : 'uuids.txt'}
        type={format === 'csv' ? 'text/csv' : 'text/plain'}
        note={sample ? 'サンプル（固定値）' : `${ids.length} 件`}
        emptyMessage="「UUIDを生成」を押すと、ここに結果が表示されます。"
      />
    </ToolWorkspace>
  );
}
