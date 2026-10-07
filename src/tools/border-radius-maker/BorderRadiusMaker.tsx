import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useState } from 'react';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { ResultPanel } from '../../components/tools/ResultPanel';
import { PreviewPanel } from '../../components/common/PreviewPanel';
import { SliderField } from '../../components/common/SliderField';
import { Button } from '../../components/common/Button';
import { ResetButton } from '../../components/common/ResetButton';
import {
  corners,
  defaultRadius,
  sampleRadius,
  randomRadius,
  radiusValue,
  updateRadius,
  type RadiusSettings,
} from './logic';
import styles from './styles.module.css';

export default function BorderRadiusMaker() {
  const [settings, setSettings] = useState<RadiusSettings>(defaultRadius);
  const value = radiusValue(settings);
  const undo = useToolUndo({ settings }, (previous) => {
    setSettings(previous.settings);
  });
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>角丸の設定</h2>
            <span>単位：%</span>
          </div>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={settings.linked}
              onChange={(event) =>
                setSettings(
                  event.target.checked
                    ? updateRadius(
                        { ...settings, linked: true },
                        'horizontal',
                        0,
                        settings.horizontal[0],
                      )
                    : { ...settings, linked: false },
                )
              }
            />
            8つの値を連動させる
          </label>
          <p className="field-hint">連動をオンにすると、すべての値を左上・横の値にそろえます。</p>
          {(
            [
              { id: 'horizontal', label: '水平方向（横）', suffix: '横' },
              { id: 'vertical', label: '垂直方向（縦）', suffix: '縦' },
            ] as const
          ).map((axis) => (
            <fieldset className={styles.axis} key={axis.id}>
              <legend>{axis.label}</legend>
              <div className={styles.sliders}>
                {corners.map((corner, index) => (
                  <SliderField
                    key={corner}
                    label={`${corner}・${axis.suffix}`}
                    min={0}
                    max={100}
                    unit="%"
                    value={settings[axis.id][index]!}
                    onChange={(next) => setSettings(updateRadius(settings, axis.id, index, next))}
                  />
                ))}
              </div>
            </fieldset>
          ))}
          <Button className="full-width" onClick={() => setSettings(randomRadius())}>
            ランダムな形にする
          </Button>
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={() => setSettings(sampleRadius)}>
              サンプル
            </SampleButton>
            <ResetButton onClick={() => setSettings(defaultRadius)} />
          </div>
        </>
      }
      tips={
        <p>
          横4値と縦4値をそれぞれ、左上・右上・右下・左下の順に指定します。個別編集やランダム生成で、丸みのある有機的な形を作れます。隣り合う角の合計が100%を超える場合は、CSSの仕様に従ってブラウザが比率を調整します。
        </p>
      }
    >
      <PreviewPanel note="LIVE PREVIEW">
        <div className={styles.stage}>
          <div
            className={styles.shape}
            style={{ borderRadius: value }}
            role="img"
            aria-label="角丸のプレビュー"
          />
        </div>
      </PreviewPanel>
      <ResultPanel
        title="CSS"
        text={`border-radius: ${value};`}
        filename="border-radius.css"
        type="text/css"
      />
    </ToolWorkspace>
  );
}
