import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../../components/common/SampleButton';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ResetButton } from '../../components/common/ResetButton';
import { ColorField } from '../../components/common/ColorField';
import { SliderField } from '../../components/common/SliderField';
import { OptionGroup } from '../../components/common/OptionGroup';
import { ImageInput } from '../../components/common/ImageInput';
import { CanvasPreview } from '../../components/common/CanvasPreview';
import { ToolWorkspace } from '../../components/tools/ToolWorkspace';
import { ResultPanel } from '../../components/tools/ResultPanel';
import { useImageInput } from '../../hooks/useImageInput';
import { useCanvasPreview } from '../../hooks/useCanvasPreview';
import { defaultFavicon, faviconHtml, faviconManifest, renderFavicon } from './logic';
import { FaviconDownloads } from './FaviconDownloads';
import styles from './styles.module.css';

function SmallIcon({ source, size }: { source: HTMLCanvasElement; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    ref.current?.getContext('2d')?.drawImage(source, 0, 0, size, size);
  }, [source, size]);
  return (
    <div>
      <canvas
        ref={ref}
        width={size}
        height={size}
        role="img"
        aria-label={`${size}pxアイコンの実寸プレビュー`}
      />
      <span>{size}px</span>
    </div>
  );
}
export default function FaviconMaker() {
  const input = useImageInput();
  const [mode, setMode] = useState<'text' | 'image'>('text'),
    [settings, setSettings] = useState(defaultFavicon);
  const source = input.image?.canvas;
  const draw = useCallback(
    () =>
      mode === 'image' && !source
        ? null
        : renderFavicon(settings, mode === 'image' ? source : undefined),
    [mode, source, settings],
  );
  const preview = useCanvasPreview(draw);
  const undo = useToolUndo({ mode, settings, inputImage: input.snapshot }, (previous) => {
    setMode(previous.mode);
    setSettings(previous.settings);
    input.restore(previous.inputImage);
  });
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>アイコンの内容</h2>
          </div>
          <OptionGroup
            label="入力方法"
            value={mode}
            onChange={(mode) => {
              setMode(mode);
              input.clear();
            }}
            options={[
              { id: 'text', label: '文字・絵文字' },
              { id: 'image', label: '画像' },
            ]}
          />
          {mode === 'image' ? (
            <ImageInput input={input} />
          ) : (
            <>
              <div className="field">
                <label htmlFor="favicon-text">文字・絵文字（4文字まで）</label>
                <input
                  id="favicon-text"
                  value={settings.text}
                  onChange={(event) => setSettings({ ...settings, text: event.target.value })}
                />
              </div>
              <ColorField
                label="文字色"
                value={settings.foreground}
                onChange={(foreground) => setSettings({ ...settings, foreground })}
              />
            </>
          )}
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={settings.transparent}
              onChange={(event) => setSettings({ ...settings, transparent: event.target.checked })}
            />
            背景を透明にする
          </label>
          {!settings.transparent && (
            <>
              <ColorField
                label="背景色"
                value={settings.background}
                onChange={(background) => setSettings({ ...settings, background })}
              />
              <SliderField
                label="背景の角丸"
                value={settings.radius}
                onChange={(radius) => setSettings({ ...settings, radius })}
                min={0}
                max={256}
              />
            </>
          )}
          <SliderField
            label="余白（512px基準）"
            value={settings.padding}
            onChange={(padding) => setSettings({ ...settings, padding })}
            min={0}
            max={160}
          />
          <div className="secondary-actions">
            <SampleButton
              variant="quiet"
              onClick={() => {
                if (mode === 'image') input.sample();
                else setSettings({ ...defaultFavicon, text: '🌿' });
              }}
            >
              サンプル
            </SampleButton>
            <ResetButton
              onClick={() => {
                input.clear();
                setMode('text');
                setSettings(defaultFavicon);
              }}
            />
          </div>
        </>
      }
      tips={
        <p>
          512pxで作成したアイコンから5サイズのPNGと、16px・32pxを含むICOを生成します。ZIPにはmanifest例とhead用HTMLも入ります。小さい実寸で視認性を確認し、manifestのサイト名・色・パスは配置先に合わせて変更してください。
        </p>
      }
    >
      <CanvasPreview {...preview}>
        <FaviconDownloads canvas={preview.canvas} />
      </CanvasPreview>
      {preview.canvas && (
        <section className="panel">
          <div className="panel-heading">
            <h2>小さいサイズで確認</h2>
          </div>
          <div className={styles.small}>
            <SmallIcon source={preview.canvas} size={16} />
            <SmallIcon source={preview.canvas} size={32} />
          </div>
        </section>
      )}
      <ResultPanel title="HTML" text={faviconHtml} filename="head.html" type="text/html" />
      <ResultPanel
        title="manifest例"
        text={faviconManifest}
        filename="site.webmanifest"
        type="application/manifest+json"
      />
    </ToolWorkspace>
  );
}
