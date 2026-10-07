import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useCallback, useState } from 'react';
import { Button } from '../../components/common/Button';
import { ResetButton } from '../../components/common/ResetButton';
import { ColorField } from '../../components/common/ColorField';
import { OptionGroup } from '../../components/common/OptionGroup';
import { CodeEditor } from '../../components/common/CodeEditor';
import { ImageInput } from '../../components/common/ImageInput';
import { ImageActions } from '../../components/common/ImageActions';
import { CanvasPreview } from '../../components/common/CanvasPreview';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { useImageInput } from '../../hooks/useImageInput';
import { useCanvasPreview } from '../../hooks/useCanvasPreview';
import { defaultOgp, ogpTemplates, renderOgp } from './logic';

export default function OgpImageMaker() {
  const background = useImageInput(),
    logo = useImageInput();
  const [settings, setSettings] = useState(defaultOgp);
  const source = background.image?.canvas,
    mark = logo.image?.canvas;
  const draw = useCallback(() => renderOgp(settings, source, mark), [settings, source, mark]);
  const preview = useCanvasPreview(draw);
  const undo = useToolUndo(
    { settings, backgroundImage: background.snapshot, logoImage: logo.snapshot },
    (previous) => {
      setSettings(previous.settings);
      background.restore(previous.backgroundImage);
      logo.restore(previous.logoImage);
    },
  );
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>内容とテンプレート</h2>
            <span>1,200 × 630 px</span>
          </div>
          <CodeEditor
            label="タイトル"
            value={settings.title}
            onChange={(event) => setSettings({ ...settings, title: event.target.value })}
            rows={3}
            hint="180文字まで。改行に対応し、枠内で文字サイズを調整します。"
          />
          <CodeEditor
            label="サブタイトル"
            value={settings.subtitle}
            onChange={(event) => setSettings({ ...settings, subtitle: event.target.value })}
            rows={2}
            hint="任意・180文字まで。"
          />
          <OptionGroup
            label="テンプレート"
            value={settings.template}
            onChange={(template) => setSettings({ ...settings, template })}
            options={ogpTemplates}
            grid
          />
          <ColorField
            label="背景色"
            value={settings.background}
            onChange={(value) => setSettings({ ...settings, background: value })}
          />
          <ColorField
            label="文字色"
            value={settings.foreground}
            onChange={(foreground) => setSettings({ ...settings, foreground })}
          />
          <ColorField
            label="アクセント色"
            value={settings.accent}
            onChange={(accent) => setSettings({ ...settings, accent })}
          />
          <fieldset className="field">
            <legend>背景画像（任意）</legend>
            <ImageInput input={background} />
            <Button
              disabled={!source && !background.busy && !background.error}
              onClick={background.clear}
            >
              背景画像を外す
            </Button>
          </fieldset>
          <fieldset className="field">
            <legend>ロゴ（任意）</legend>
            <ImageInput input={logo} />
            <Button disabled={!mark && !logo.busy && !logo.error} onClick={logo.clear}>
              ロゴを外す
            </Button>
          </fieldset>
          <div className="secondary-actions">
            <SampleButton
              variant="quiet"
              onClick={() => {
                setSettings({ ...defaultOgp, template: 'split' });
                background.sample();
              }}
            >
              サンプル
            </SampleButton>
            <ResetButton
              onClick={() => {
                background.clear();
                logo.clear();
                setSettings(defaultOgp);
              }}
            />
          </div>
        </>
      }
      tips={
        <p>
          OGP用の1,200 ×
          630px画像を作成します。背景画像は中央を切り抜き、文字の領域に下地を重ねます。グラデーションテンプレートは背景色とアクセント色を使います。ロゴは比率を保って配置します。文字が収まらない場合は、文章を短くしてください。
        </p>
      }
    >
      <CanvasPreview {...preview}>
        <ImageActions
          canvas={
            background.busy || logo.busy || background.error || logo.error ? null : preview.canvas
          }
          filename="ogp-image"
        />
      </CanvasPreview>
    </ToolWorkspace>
  );
}
