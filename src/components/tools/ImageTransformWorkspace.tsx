import { useToolUndo } from '../../hooks/useToolUndo';
import { SampleButton } from '../common/SampleButton';
import { useCallback, useState } from 'react';
import { useImageInput } from '../../hooks/useImageInput';
import { useCanvasPreview } from '../../hooks/useCanvasPreview';
import { useEncodedPreview } from '../../hooks/useEncodedPreview';
import { ImageSizeSummary } from '../common/ImageSizeSummary';
import { type ImageFormat } from '../../lib/canvas';
import { targetSize, transformImage, type ResizeMode } from '../../lib/image-transform';
import { ImageInput } from '../common/ImageInput';
import { CanvasPreview } from '../common/CanvasPreview';
import { ImageActions } from '../common/ImageActions';
import { ImageFormatFields } from '../common/ImageFormatFields';
import { NumberField } from '../common/NumberField';
import { OptionGroup } from '../common/OptionGroup';
import { ResetButton } from '../common/ResetButton';
import { ToolWorkspace } from './ToolWorkspace';

export function ImageTransformWorkspace({ resize }: { resize: boolean }) {
  const [width, setWidth] = useState('800'),
    [height, setHeight] = useState('500');
  const [locked, setLocked] = useState(true);
  const [unit, setUnit] = useState<'px' | 'percent'>('px');
  const [percent, setPercent] = useState('100');
  const [mode, setMode] = useState<ResizeMode>('fit');
  const [format, setFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState(92),
    [matte, setMatte] = useState('#ffffff');
  const input = useImageInput(({ canvas }) => {
    setWidth(String(canvas.width));
    setHeight(String(canvas.height));
    setPercent('100');
  });
  const source = input.image?.canvas;
  function changeWidth(value: string) {
    setWidth(value);
    if (locked && source && Number(value) > 0)
      setHeight(String(Math.max(1, Math.round((Number(value) * source.height) / source.width))));
  }
  function changeHeight(value: string) {
    setHeight(value);
    if (locked && source && Number(value) > 0)
      setWidth(String(Math.max(1, Math.round((Number(value) * source.width) / source.height))));
  }
  const draw = useCallback(() => {
    if (!source) return null;
    const actualMode = resize ? mode : 'stretch';
    return transformImage(
      source,
      targetSize(source, width, height, resize && unit === 'percent' ? percent : null, actualMode),
      actualMode,
      format,
      matte,
    );
  }, [source, resize, mode, width, height, unit, percent, format, matte]);
  const preview = useCanvasPreview(draw);
  const encoded = useEncodedPreview(preview.canvas, format, quality / 100);
  const undo = useToolUndo(
    {
      width,
      height,
      locked,
      unit,
      percent,
      mode,
      format,
      quality,
      matte,
      inputImage: input.snapshot,
    },
    (previous) => {
      setWidth(previous.width);
      setHeight(previous.height);
      setLocked(previous.locked);
      setUnit(previous.unit);
      setPercent(previous.percent);
      setMode(previous.mode);
      setFormat(previous.format);
      setQuality(previous.quality);
      setMatte(previous.matte);
      input.restore(previous.inputImage);
    },
  );
  return (
    <ToolWorkspace
      undo={undo}
      controls={
        <>
          <div className="panel-heading">
            <h2>画像とサイズ</h2>
          </div>
          <ImageInput input={input} />
          {resize && (
            <OptionGroup
              label="サイズの指定"
              value={unit}
              onChange={setUnit}
              options={[
                { id: 'px', label: 'ピクセル（px）' },
                { id: 'percent', label: '割合（%）' },
              ]}
            />
          )}
          {resize && unit === 'percent' ? (
            <NumberField
              label="元画像に対する倍率（%）"
              value={percent}
              onChange={setPercent}
              min={0.01}
              max={400}
            />
          ) : (
            <>
              <div className="dimensions-fields">
                <NumberField
                  label="幅（px）"
                  value={width}
                  onChange={changeWidth}
                  min={1}
                  max={8192}
                  step={1}
                />
                <NumberField
                  label="高さ（px）"
                  value={height}
                  onChange={changeHeight}
                  min={1}
                  max={8192}
                  step={1}
                />
              </div>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={locked}
                  onChange={(event) => {
                    setLocked(event.target.checked);
                    if (event.target.checked && source && Number(width) > 0)
                      setHeight(
                        String(
                          Math.max(1, Math.round((Number(width) * source.height) / source.width)),
                        ),
                      );
                  }}
                />
                元画像の縦横比を固定
              </label>
            </>
          )}
          {resize && (
            <OptionGroup
              label="収め方"
              value={mode}
              onChange={setMode}
              grid
              options={[
                { id: 'fit', label: 'Fit · 枠内の実寸' },
                { id: 'contain', label: 'Contain · 余白を追加' },
                { id: 'cover', label: 'Cover · 中央を切り抜き' },
              ]}
            />
          )}
          <ImageFormatFields {...{ format, setFormat, quality, setQuality, matte, setMatte }} />
          <div className="secondary-actions">
            <SampleButton variant="quiet" onClick={input.sample}>
              サンプル
            </SampleButton>
            <ResetButton
              onClick={() => {
                input.clear();
                setWidth('800');
                setHeight('500');
                setLocked(true);
                setUnit('px');
                setPercent('100');
                setMode('fit');
                setFormat('png');
                setQuality(92);
                setMatte('#ffffff');
              }}
            />
          </div>
        </>
      }
      tips={
        <p>
          {resize
            ? 'Fitは指定した枠内に収まる実寸で出力します。Containは余白を追加し、Coverは中央を切り抜いて指定サイズにそろえます。'
            : 'PNG・JPEG・WebPに変換します。縦横比を解除すると指定寸法へ引き伸ばします。'}{' '}
          圧縮後のプレビューと容量を確認してから保存できます。画像をコピーするとPNG形式になります。アニメーションは静止画1枚になり、元のメタデータは引き継ぎません。
        </p>
      }
    >
      <CanvasPreview
        canvas={encoded.canvas}
        error={preview.error || encoded.error}
        busy={preview.busy || encoded.busy}
      >
        <ImageActions
          canvas={encoded.canvas}
          preparedBlob={encoded.blob ?? undefined}
          format={format}
          quality={quality / 100}
          filename={resize ? 'resized' : 'converted'}
        />
      </CanvasPreview>
      {encoded.blob && (
        <ImageSizeSummary sourceBytes={input.image?.bytes} outputBytes={encoded.blob.size} />
      )}
    </ToolWorkspace>
  );
}
