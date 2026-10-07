import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useState } from 'react';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { ResultPanel } from '../../components/tools/ResultPanel';
import { PreviewPanel } from '../../components/common/PreviewPanel';
import { Button } from '../../components/common/Button';
import { ColorField } from '../../components/common/ColorField';
import { SliderField } from '../../components/common/SliderField';
import { ResetButton } from '../../components/common/ResetButton';
import { ErrorNotice } from '../../components/common/ErrorNotice';
import { Icon } from '../../components/common/Icon';
import { errorMessage } from '../../lib/errors';
import {
  defaultGradient,
  gradientPresets,
  gradientValue,
  newStop,
  type ColorStop,
  type GradientSettings,
} from './logic';
import styles from './styles.module.css';

export default function GradientMaker() {
  const [settings, setSettings] = useState<GradientSettings>(defaultGradient);
  let value = '';
  let error = '';
  try {
    value = gradientValue(settings);
  } catch (cause) {
    error = errorMessage(cause);
  }
  function updateStop(id: number, patch: Partial<ColorStop>) {
    setSettings((previous) => ({
      ...previous,
      stops: previous.stops.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)),
    }));
  }
  function applyPreset(colors: readonly string[]) {
    setSettings({
      kind: 'linear',
      angle: 135,
      stops: colors.map((color, index) => ({
        id: index,
        color,
        position: Math.round((index / (colors.length - 1)) * 100),
      })),
    });
  }
  const undo = useToolUndo({ settings }, (previous) => {
    setSettings(previous.settings);
  });
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>グラデーション設定</h2>
          </div>
          <fieldset className="field">
            <legend>種類</legend>
            <div className="segmented">
              {(
                [
                  { id: 'linear', label: '線形 / Linear' },
                  { id: 'radial', label: '円形 / Radial' },
                ] as const
              ).map((kind) => (
                <label key={kind.id}>
                  <input
                    type="radio"
                    name="gradient-kind"
                    checked={settings.kind === kind.id}
                    onChange={() => setSettings({ ...settings, kind: kind.id })}
                  />
                  <span>{kind.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {settings.kind === 'linear' && (
            <SliderField
              label="角度"
              min={0}
              max={360}
              value={settings.angle}
              onChange={(angle) => setSettings({ ...settings, angle })}
              unit="°"
            />
          )}
          <div className="subsection-heading">
            <h3>カラーと位置</h3>
            <span>{settings.stops.length} / 8 色</span>
          </div>
          <div className={styles.stops}>
            {settings.stops.map((stop, index) => (
              <div key={stop.id} className={styles.stop}>
                <div className={styles.stopHeader}>
                  <ColorField
                    label={`カラー ${index + 1}`}
                    value={stop.color}
                    onChange={(color) => updateStop(stop.id, { color })}
                  />
                  <Button
                    variant="quiet"
                    disabled={settings.stops.length <= 2}
                    aria-label={`カラー ${index + 1} を削除`}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        stops: settings.stops.filter((entry) => entry.id !== stop.id),
                      })
                    }
                  >
                    削除
                  </Button>
                </div>
                <SliderField
                  label={`カラー ${index + 1} の位置`}
                  min={0}
                  max={100}
                  unit="%"
                  value={stop.position}
                  onChange={(position) => updateStop(stop.id, { position })}
                />
              </div>
            ))}
          </div>
          <Button
            className="full-width"
            disabled={settings.stops.length >= 8}
            onClick={() =>
              setSettings({
                ...settings,
                stops: [
                  ...settings.stops,
                  newStop(settings.stops, Math.max(...settings.stops.map((stop) => stop.id)) + 1),
                ],
              })
            }
          >
            <Icon name="plus" size={17} />
            色を追加
          </Button>
          <ErrorNotice message={error} />
          <div className="field preset-field">
            <span className="field-label">プリセット</span>
            <div className={styles.presets}>
              {gradientPresets.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => applyPreset(preset.colors)}
                  aria-label={`${preset.name}プリセット`}
                  title={preset.name}
                >
                  <span
                    style={{ background: `linear-gradient(135deg, ${preset.colors.join(',')})` }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={() => applyPreset(gradientPresets[1].colors)}>
              サンプル
            </SampleButton>
            <ResetButton onClick={() => setSettings(defaultGradient)} />
          </div>
        </>
      }
      tips={
        <p>
          色と位置を調整すると、プレビューにすぐ反映されます。色は2〜8色。位置の順序は出力時に自動で並び替えます。「CSSをコピー」からスタイルシートへ貼り付けて使えます。
        </p>
      }
    >
      <PreviewPanel note={settings.kind === 'linear' ? 'LINEAR' : 'RADIAL'}>
        <div
          className={styles.preview}
          style={{ backgroundImage: value || undefined }}
          role="img"
          aria-label="グラデーションのプレビュー"
        >
          {!value && <span className={styles.errorOverlay}>色の入力を確認してください</span>}
          <span className={styles.previewLabel}>LIVE PREVIEW</span>
        </div>
      </PreviewPanel>
      <ResultPanel
        title="CSS"
        text={value ? `background: ${value};` : ''}
        filename="gradient.css"
        type="text/css"
        emptyMessage="有効な色を指定するとCSSが表示されます。"
      />
    </ToolWorkspace>
  );
}
