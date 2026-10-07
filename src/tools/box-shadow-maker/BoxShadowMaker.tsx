import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useState } from 'react';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { ResultPanel } from '../../components/tools/ResultPanel';
import { PreviewPanel } from '../../components/common/PreviewPanel';
import { SliderField } from '../../components/common/SliderField';
import { ColorField } from '../../components/common/ColorField';
import { ResetButton } from '../../components/common/ResetButton';
import { ErrorNotice } from '../../components/common/ErrorNotice';
import { errorMessage } from '../../lib/errors';
import { defaultShadow, sampleShadow, shadowValue, type ShadowSettings } from './logic';
import styles from './styles.module.css';

export default function BoxShadowMaker() {
  const [settings, setSettings] = useState<ShadowSettings>(defaultShadow);
  let value = '';
  let error = '';
  try {
    value = shadowValue(settings);
  } catch (cause) {
    error = errorMessage(cause);
  }
  function change<K extends keyof ShadowSettings>(key: K, value: ShadowSettings[K]) {
    setSettings((previous) => ({ ...previous, [key]: value }));
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
            <h2>影の設定</h2>
          </div>
          <SliderField
            label="水平方向（X）"
            min={-100}
            max={100}
            value={settings.x}
            onChange={(value) => change('x', value)}
          />
          <SliderField
            label="垂直方向（Y）"
            min={-100}
            max={100}
            value={settings.y}
            onChange={(value) => change('y', value)}
          />
          <SliderField
            label="ぼかし"
            min={0}
            max={100}
            value={settings.blur}
            onChange={(value) => change('blur', value)}
          />
          <SliderField
            label="広がり"
            min={-50}
            max={50}
            value={settings.spread}
            onChange={(value) => change('spread', value)}
          />
          <ColorField
            label="影の色"
            value={settings.color}
            onChange={(value) => change('color', value)}
          />
          <SliderField
            label="不透明度"
            min={0}
            max={100}
            unit="%"
            value={settings.opacity}
            onChange={(value) => change('opacity', value)}
          />
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={settings.inset}
              onChange={(event) => change('inset', event.target.checked)}
            />
            内側に影をつける（inset）
          </label>
          <ErrorNotice message={error} />
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={() => setSettings(sampleShadow)}>
              サンプル
            </SampleButton>
            <ResetButton onClick={() => setSettings(defaultShadow)} />
          </div>
        </>
      }
      tips={
        <p>
          X・Yで影の方向、ぼかしと広がりで柔らかさを調整します。「内側に影をつける」を選ぶと、くぼんだような表現になります。プレビューの背景とオブジェクトの色は、ライト・ダークモードに影響されません。
        </p>
      }
    >
      <PreviewPanel note="LIVE PREVIEW">
        <div className={styles.stage} role="img" aria-label="ボックスシャドウのプレビュー">
          <div className={styles.object} style={{ boxShadow: value || undefined }}>
            <span className={styles.objectIcon}>□</span>
            <span>{value ? 'ひかえめに、いい感じ。' : '色の入力を確認してください'}</span>
            <small>BOX SHADOW</small>
          </div>
        </div>
      </PreviewPanel>
      <ResultPanel
        title="CSS"
        text={value ? `box-shadow: ${value};` : ''}
        filename="box-shadow.css"
        type="text/css"
        emptyMessage="有効な色を指定するとCSSが表示されます。"
      />
    </ToolWorkspace>
  );
}
