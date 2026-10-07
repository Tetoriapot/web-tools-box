import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useCallback, useState } from 'react';
import { ResetButton } from '../../components/common/ResetButton';
import { ColorField } from '../../components/common/ColorField';
import { SliderField } from '../../components/common/SliderField';
import { OptionGroup } from '../../components/common/OptionGroup';
import { CodeEditor } from '../../components/common/CodeEditor';
import { ImageActions } from '../../components/common/ImageActions';
import { CanvasPreview } from '../../components/common/CanvasPreview';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { useCanvasPreview } from '../../hooks/useCanvasPreview';
import { CODE_SAMPLE, codeThemes, defaultCodeSettings, renderCode } from './logic';

export default function CodeShot() {
  const [text, setText] = useState(CODE_SAMPLE),
    [settings, setSettings] = useState(defaultCodeSettings);
  const draw = useCallback(() => renderCode(text, settings), [text, settings]);
  const preview = useCanvasPreview(draw);
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
            <h2>コードと見た目</h2>
          </div>
          <CodeEditor
            label="コード・テキスト"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={12}
            hint="10,000文字・120行まで。入力は実行せず、テキストとして描画します。"
          />
          <OptionGroup
            label="コードのテーマ"
            value={settings.theme}
            onChange={(theme) => setSettings({ ...settings, theme })}
            options={codeThemes}
          />
          <SliderField
            label="フォントサイズ"
            value={settings.fontSize}
            onChange={(fontSize) => setSettings({ ...settings, fontSize })}
            min={12}
            max={32}
          />
          <SliderField
            label="外側の余白"
            value={settings.padding}
            onChange={(padding) => setSettings({ ...settings, padding })}
            min={16}
            max={120}
          />
          <ColorField
            label="背景色"
            value={settings.background}
            onChange={(background) => setSettings({ ...settings, background })}
          />
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={settings.lineNumbers}
              onChange={(event) => setSettings({ ...settings, lineNumbers: event.target.checked })}
            />
            行番号を表示
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={settings.header}
              onChange={(event) => setSettings({ ...settings, header: event.target.checked })}
            />
            ウィンドウ風ヘッダーを表示
          </label>
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={() => setText(CODE_SAMPLE)}>
              サンプル
            </SampleButton>
            <ResetButton
              onClick={() => {
                setText(CODE_SAMPLE);
                setSettings(defaultCodeSettings);
              }}
            />
          </div>
        </>
      }
      tips={
        <p>
          コードを等幅フォントで画像にします。Tabは4スペースとして描画します。日本語・絵文字の字形は端末のフォントに依存します。サイトのテーマを切り替えても、出力の配色は変わりません。
        </p>
      }
    >
      <CanvasPreview {...preview}>
        <ImageActions canvas={preview.canvas} filename="code-shot" />
      </CanvasPreview>
    </ToolWorkspace>
  );
}
