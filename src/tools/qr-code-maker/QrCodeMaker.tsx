import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useCallback, useMemo, useState } from 'react';
import { ResetButton } from '../../components/common/ResetButton';
import { ColorField } from '../../components/common/ColorField';
import { SliderField } from '../../components/common/SliderField';
import { NumberField } from '../../components/common/NumberField';
import { CodeEditor } from '../../components/common/CodeEditor';
import { ImageActions } from '../../components/common/ImageActions';
import { CanvasPreview } from '../../components/common/CanvasPreview';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { ResultPanel } from '../../components/tools/ResultPanel';
import { useCanvasPreview } from '../../hooks/useCanvasPreview';
import { defaultQr, qrSvg, renderQr } from './logic';

const SAMPLE = 'https://example.com/';
export default function QrCodeMaker() {
  const [text, setText] = useState(SAMPLE),
    [settings, setSettings] = useState(defaultQr);
  const draw = useCallback(() => renderQr(text, settings), [text, settings]);
  const preview = useCanvasPreview(draw);
  const svg = useMemo(() => {
    try {
      return qrSvg(text, settings);
    } catch {
      return '';
    }
  }, [text, settings]);
  const undo = useToolUndo({ text, settings }, (previous) => {
    setText(previous.text);
    setSettings(previous.settings);
  });
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>QRコードの内容</h2>
          </div>
          <CodeEditor
            label="URL・テキスト"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            hint="UTF-8で1,500バイトまで。入力したURLにはアクセスしません。"
          />
          <NumberField
            label="サイズ（px）"
            value={settings.size}
            onChange={(size) => setSettings({ ...settings, size })}
            min={128}
            max={2048}
            step={1}
          />
          <SliderField
            label="余白"
            value={settings.margin}
            onChange={(margin) => setSettings({ ...settings, margin })}
            min={4}
            max={12}
            unit="モジュール"
          />
          <ColorField
            label="前景色"
            value={settings.foreground}
            onChange={(foreground) => setSettings({ ...settings, foreground })}
          />
          <ColorField
            label="背景色"
            value={settings.background}
            onChange={(background) => setSettings({ ...settings, background })}
          />
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={() => setText(SAMPLE)}>
              サンプル
            </SampleButton>
            <ResetButton
              onClick={() => {
                setText(SAMPLE);
                setSettings(defaultQr);
              }}
            />
          </div>
        </>
      }
      tips={
        <p>
          誤り訂正レベルMで生成します。読み取りのために余白を4モジュール以上確保し、前景を背景より暗くしてください。公開・印刷前には、実際の端末で読み取りを確認してください。
        </p>
      }
    >
      <CanvasPreview {...preview}>
        <ImageActions canvas={preview.canvas} filename="qr-code" />
      </CanvasPreview>
      <ResultPanel title="SVG" text={svg} filename="qr-code.svg" type="image/svg+xml" />
    </ToolWorkspace>
  );
}
