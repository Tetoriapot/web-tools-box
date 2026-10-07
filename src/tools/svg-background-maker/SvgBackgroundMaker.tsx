import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useState } from 'react';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { ResultPanel } from '../../components/tools/ResultPanel';
import { PreviewPanel } from '../../components/common/PreviewPanel';
import { OptionGroup } from '../../components/common/OptionGroup';
import { ColorField } from '../../components/common/ColorField';
import { SliderField } from '../../components/common/SliderField';
import { ErrorNotice } from '../../components/common/ErrorNotice';
import { ResetButton } from '../../components/common/ResetButton';
import { errorMessage } from '../../lib/errors';
import { formatNumber } from '../../lib/numbers';
import {
  backgroundOutput,
  defaultBackground,
  sampleBackground,
  patterns,
  outputFormats,
  type BackgroundSettings,
  type OutputFormat,
} from './logic';
import styles from './styles.module.css';

export default function SvgBackgroundMaker() {
  const [settings, setSettings] = useState<BackgroundSettings>(defaultBackground);
  const [format, setFormat] = useState<OutputFormat>('svg');
  let result: ReturnType<typeof backgroundOutput> | null = null;
  let error = '';
  try {
    result = backgroundOutput(settings);
  } catch (cause) {
    error = errorMessage(cause);
  }
  const metadata = {
    svg: { title: 'SVG', extension: 'svg', type: 'image/svg+xml' },
    css: { title: 'CSS', extension: 'css', type: 'text/css' },
    uri: { title: 'Data URI', extension: 'txt', type: 'text/plain' },
  }[format];
  function update<K extends keyof BackgroundSettings>(key: K, value: BackgroundSettings[K]) {
    setSettings({ ...settings, [key]: value });
  }
  const undo = useToolUndo({ settings, format }, (previous) => {
    setSettings(previous.settings);
    setFormat(previous.format);
  });
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>背景の設定</h2>
          </div>
          <OptionGroup
            label="パターン"
            value={settings.pattern}
            onChange={(value) => update('pattern', value)}
            options={patterns}
            grid
          />
          <SliderField
            label="パターンサイズ"
            min={12}
            max={100}
            value={settings.size}
            onChange={(value) => update('size', value)}
          />
          {settings.pattern !== 'checker' && settings.pattern !== 'triangle' && (
            <SliderField
              label={settings.pattern === 'dots' ? '点の直径' : '線の太さ'}
              min={1}
              max={8}
              value={settings.thickness}
              onChange={(value) => update('thickness', value)}
            />
          )}
          <ColorField
            label="模様の色"
            value={settings.foreground}
            onChange={(value) => update('foreground', value)}
          />
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={settings.transparent}
              onChange={(event) => update('transparent', event.target.checked)}
            />
            背景を透明にする
          </label>
          {!settings.transparent && (
            <ColorField
              label="背景色"
              value={settings.background}
              onChange={(value) => update('background', value)}
            />
          )}
          <ErrorNotice message={error} />
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={() => setSettings(sampleBackground)}>
              サンプル
            </SampleButton>
            <ResetButton
              onClick={() => {
                setSettings(defaultBackground);
                setFormat('svg');
              }}
            />
          </div>
        </>
      }
      tips={
        <p>
          SVGは繰り返し用の1タイルです。Webページに敷き詰める場合はCSSをコピーしてください。Data
          URIは外部の画像ファイルなしで使えます。透明部分の確認用チェック模様は、出力データには含まれません。
        </p>
      }
    >
      <PreviewPanel
        note={
          result
            ? `1タイル ${formatNumber(result.width, 2)} × ${formatNumber(result.height, 2)} px`
            : undefined
        }
      >
        <div className={styles.checker}>
          <div
            className={styles.preview}
            role="img"
            aria-label="SVG背景のプレビュー"
            style={{
              backgroundImage: result ? `url("${result.uri}")` : undefined,
              backgroundSize: result ? `${result.width}px ${result.height}px` : undefined,
            }}
          >
            {!result && <span>色の入力を確認してください</span>}
          </div>
        </div>
      </PreviewPanel>
      <ResultPanel
        title={metadata.title}
        text={result?.[format] ?? ''}
        filename={`background.${metadata.extension}`}
        type={metadata.type}
        toolbar={
          <OptionGroup
            label="出力形式"
            value={format}
            onChange={setFormat}
            options={outputFormats}
          />
        }
        emptyMessage="有効な色を指定すると、出力が表示されます。"
      />
    </ToolWorkspace>
  );
}
