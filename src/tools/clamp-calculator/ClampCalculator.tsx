import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useState } from 'react';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { ResultPanel } from '../../components/tools/ResultPanel';
import { PreviewPanel } from '../../components/common/PreviewPanel';
import { NumberField } from '../../components/common/NumberField';
import { SliderField } from '../../components/common/SliderField';
import { ErrorNotice } from '../../components/common/ErrorNotice';
import { ResetButton } from '../../components/common/ResetButton';
import { errorMessage } from '../../lib/errors';
import { formatNumber } from '../../lib/numbers';
import {
  calculateClamp,
  defaultClamp,
  sampleClamp,
  sizeAtViewport,
  type ClampInput,
  type ClampResult,
} from './logic';
import styles from './styles.module.css';

export default function ClampCalculator() {
  const [input, setInput] = useState<ClampInput>(defaultClamp);
  const [viewport, setViewport] = useState(768);
  let result: ClampResult | null = null;
  let error = '';
  try {
    result = calculateClamp(input);
  } catch (cause) {
    error = errorMessage(cause);
  }
  const size = result ? sizeAtViewport(result, viewport) : null;
  const undo = useToolUndo({ input, viewport }, (previous) => {
    setInput(previous.input);
    setViewport(previous.viewport);
  });
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>サイズと画面幅</h2>
            <span>単位：px</span>
          </div>
          {(
            [
              { key: 'minSize', label: '最小サイズ（px）', min: 0, max: 1000 },
              { key: 'maxSize', label: '最大サイズ（px）', min: 0, max: 1000 },
              { key: 'minViewport', label: '最小画面幅（px）', min: 1, max: 10000 },
              { key: 'maxViewport', label: '最大画面幅（px）', min: 1, max: 10000 },
            ] as const
          ).map((field) => (
            <NumberField
              key={field.key}
              label={field.label}
              value={input[field.key]}
              onChange={(value) => setInput({ ...input, [field.key]: value })}
              min={field.min}
              max={field.max}
              hint={`${field.min.toLocaleString()}〜${field.max.toLocaleString()}px`}
            />
          ))}
          <ErrorNotice message={error} />
          <div className="secondary-actions">
            <SampleButton
              variant="quiet"
              onClick={() => {
                setInput(sampleClamp);
                setViewport(768);
              }}
            >
              サンプル
            </SampleButton>
            <ResetButton
              onClick={() => {
                setInput(defaultClamp);
                setViewport(768);
              }}
            />
          </div>
        </>
      }
      tips={
        <p>
          画面幅が指定範囲の内側にあるときは、サイズが直線的に変化します。範囲外では最小・最大サイズで固定されます。CSSはfont-size用に出力しますが、clamp()部分を余白などにも使えます。px基準の計算です。
        </p>
      }
    >
      <PreviewPanel note="画面幅をシミュレーション">
        <SliderField
          label="確認する画面幅"
          min={1}
          max={10000}
          value={viewport}
          onChange={setViewport}
          unit="px"
        />
        <div className={styles.readout}>
          <span>計算されたサイズ</span>
          <output aria-label="計算されたサイズ">
            {size === null ? '—' : `${formatNumber(size, 2)} px`}
          </output>
        </div>
        <div className={styles.stage}>
          {size === null ? (
            <p>入力内容を確認してください</p>
          ) : (
            <p style={{ fontSize: Math.min(size, 96) }}>
              Aa
              <br />
              ちょうどいい文字。
            </p>
          )}
        </div>
        {size !== null && size > 96 && (
          <p className="field-hint">
            大きな値のプレビューは96pxで表示しています。出力CSSと計算値は元のサイズです。
          </p>
        )}
        {result && (
          <dl className={styles.endpoints}>
            <div>
              <dt>{formatNumber(result.minViewport)}px以下</dt>
              <dd>{formatNumber(result.minSize)}px</dd>
            </div>
            <div>
              <dt>{formatNumber(result.maxViewport)}px以上</dt>
              <dd>{formatNumber(result.maxSize)}px</dd>
            </div>
          </dl>
        )}
      </PreviewPanel>
      <ResultPanel
        title="CSS"
        text={result ? `font-size: ${result.css};` : ''}
        filename="clamp.css"
        type="text/css"
        emptyMessage="4つの値を入力すると、CSSが表示されます。"
      />
    </ToolWorkspace>
  );
}
