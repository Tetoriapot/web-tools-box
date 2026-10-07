import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useCallback, useState } from 'react';
import { ResetButton } from '../../components/common/ResetButton';
import { ColorField } from '../../components/common/ColorField';
import { SliderField } from '../../components/common/SliderField';
import { OptionGroup } from '../../components/common/OptionGroup';
import { ImageInput } from '../../components/common/ImageInput';
import { ImageActions } from '../../components/common/ImageActions';
import { CanvasPreview } from '../../components/common/CanvasPreview';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { useImageInput } from '../../hooks/useImageInput';
import { useCanvasPreview } from '../../hooks/useCanvasPreview';
import { decorate, defaultDecoration } from './logic';

export default function ScreenshotDecorator() {
  const input = useImageInput();
  const [settings, setSettings] = useState(defaultDecoration);
  const [format, setFormat] = useState<'png' | 'webp'>('png');
  const source = input.image?.canvas;
  const draw = useCallback(() => (source ? decorate(source, settings) : null), [source, settings]);
  const preview = useCanvasPreview(draw);
  const undo = useToolUndo({ settings, format, inputImage: input.snapshot }, (previous) => {
    setSettings(previous.settings);
    setFormat(previous.format);
    input.restore(previous.inputImage);
  });
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>画像と装飾</h2>
          </div>
          <ImageInput input={input} />
          <OptionGroup
            label="出力の比率"
            value={settings.ratio}
            onChange={(ratio) => setSettings({ ...settings, ratio })}
            options={[
              { id: 'auto', label: '自動' },
              { id: '1:1', label: '1:1' },
              { id: '4:3', label: '4:3' },
              { id: '16:9', label: '16:9' },
            ]}
          />
          <ColorField
            label="背景色"
            value={settings.background}
            onChange={(background) => setSettings({ ...settings, background })}
          />
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={settings.gradient}
              onChange={(event) => setSettings({ ...settings, gradient: event.target.checked })}
            />
            グラデーションを使う
          </label>
          {settings.gradient && (
            <ColorField
              label="グラデーションの終点色"
              value={settings.endColor}
              onChange={(endColor) => setSettings({ ...settings, endColor })}
            />
          )}
          <SliderField
            label="余白"
            value={settings.padding}
            onChange={(padding) => setSettings({ ...settings, padding })}
            min={16}
            max={200}
          />
          <SliderField
            label="角丸"
            value={settings.radius}
            onChange={(radius) => setSettings({ ...settings, radius })}
            min={0}
            max={80}
          />
          <SliderField
            label="影のぼかし"
            value={settings.shadow}
            onChange={(shadow) => setSettings({ ...settings, shadow })}
            min={0}
            max={80}
          />
          <SliderField
            label="枠線の太さ"
            value={settings.border}
            onChange={(border) => setSettings({ ...settings, border })}
            min={0}
            max={8}
          />
          {settings.border > 0 && (
            <ColorField
              label="枠線の色"
              value={settings.borderColor}
              onChange={(borderColor) => setSettings({ ...settings, borderColor })}
            />
          )}
          <OptionGroup
            label="保存形式"
            value={format}
            onChange={setFormat}
            options={[
              { id: 'png', label: 'PNG' },
              { id: 'webp', label: 'WebP' },
            ]}
          />
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={input.sample}>
              サンプル
            </SampleButton>
            <ResetButton
              onClick={() => {
                input.clear();
                setSettings(defaultDecoration);
                setFormat('png');
              }}
            />
          </div>
        </>
      }
      tips={
        <p>
          画像1枚を背景と余白で整えます。元画像の縦横比を保ち、長辺1,600pxを超える画像は縮小して配置します。指定比率のキャンバス中央に表示し、出力寸法はプレビュー上部で確認できます。
        </p>
      }
    >
      <CanvasPreview {...preview}>
        <ImageActions canvas={preview.canvas} format={format} filename="screenshot" />
      </CanvasPreview>
    </ToolWorkspace>
  );
}
