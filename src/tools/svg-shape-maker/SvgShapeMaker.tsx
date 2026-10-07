import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useState } from 'react';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { ResultPanel } from '../../components/tools/ResultPanel';
import { PreviewPanel } from '../../components/common/PreviewPanel';
import { OptionGroup } from '../../components/common/OptionGroup';
import { ColorField } from '../../components/common/ColorField';
import { SliderField } from '../../components/common/SliderField';
import { NumberField } from '../../components/common/NumberField';
import { ErrorNotice } from '../../components/common/ErrorNotice';
import { Button } from '../../components/common/Button';
import { ResetButton } from '../../components/common/ResetButton';
import { errorMessage } from '../../lib/errors';
import {
  defaultShape,
  sampleShape,
  shapes,
  shapeOutput,
  SHAPE_WIDTH,
  type ShapeSettings,
} from './logic';
import styles from './styles.module.css';

export default function SvgShapeMaker() {
  const [settings, setSettings] = useState<ShapeSettings>(defaultShape);
  let result: ReturnType<typeof shapeOutput> | null = null;
  let error = '';
  try {
    result = shapeOutput(settings);
  } catch (cause) {
    error = errorMessage(cause);
  }
  function update<K extends keyof ShapeSettings>(key: K, value: ShapeSettings[K]) {
    setSettings({ ...settings, [key]: value });
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
            <h2>シェイプの設定</h2>
          </div>
          <OptionGroup
            label="形の種類"
            value={settings.kind}
            onChange={(value) => update('kind', value)}
            options={shapes}
            grid
          />
          <SliderField
            label="高さ"
            min={80}
            max={600}
            value={settings.height}
            onChange={(value) => update('height', value)}
          />
          <SliderField
            label="複雑さ"
            min={2}
            max={12}
            value={settings.complexity}
            onChange={(value) => update('complexity', value)}
            unit=""
          />
          <ColorField
            label="シェイプの色"
            value={settings.color}
            onChange={(value) => update('color', value)}
          />
          <NumberField
            label="Seed（形の番号）"
            value={settings.seed}
            onChange={(value) => update('seed', value)}
            min={0}
            max={4294967295}
            step={1}
            hint="0〜4,294,967,295の整数。同じ設定・番号なら同じ形になります。"
          />
          <Button
            className="full-width"
            onClick={() => update('seed', String((Number(settings.seed) + 1) >>> 0))}
          >
            次の形を試す
          </Button>
          <div className={styles.flips}>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={settings.flipX}
                onChange={(event) => update('flipX', event.target.checked)}
              />
              左右反転
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={settings.flipY}
                onChange={(event) => update('flipY', event.target.checked)}
              />
              上下反転
            </label>
          </div>
          <ErrorNotice message={error} />
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={() => setSettings(sampleShape)}>
              サンプル
            </SampleButton>
            <ResetButton onClick={() => setSettings(defaultShape)} />
          </div>
        </>
      }
      tips={
        <p>
          背景は透明です。SVGを画像として保存するか、コードをコピーして使えます。波・山・曲線・ジグザグはセクション境界に、Blobは独立した装飾に向いています。出力幅は1,200pxで、WebページではCSSで表示幅を調整できます。
        </p>
      }
    >
      <PreviewPanel note={`${SHAPE_WIDTH} × ${settings.height} px`}>
        <div className={styles.stage}>
          {result ? (
            <img className={styles.preview} src={result.uri} alt="SVGシェイプのプレビュー" />
          ) : (
            <p>入力内容を確認してください</p>
          )}
        </div>
        <p className="field-hint">
          チェック模様は透明部分です。プレビューは出力の縦横比を保って縮小表示します。
        </p>
      </PreviewPanel>
      <ResultPanel
        title="SVG"
        text={result?.svg ?? ''}
        filename={`shape-${settings.kind}.svg`}
        type="image/svg+xml"
        emptyMessage="有効な設定を指定するとSVGが表示されます。"
      />
    </ToolWorkspace>
  );
}
