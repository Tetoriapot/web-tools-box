import { ColorField } from './ColorField';
import { OptionGroup } from './OptionGroup';
import { SliderField } from './SliderField';
import { formats, type ImageFormat } from '../../lib/canvas';

export function ImageFormatFields({
  format,
  setFormat,
  quality,
  setQuality,
  matte,
  setMatte,
}: {
  format: ImageFormat;
  setFormat: (format: ImageFormat) => void;
  quality: number;
  setQuality: (quality: number) => void;
  matte: string;
  setMatte: (color: string) => void;
}) {
  return (
    <>
      <OptionGroup label="保存形式" value={format} onChange={setFormat} options={formats} />
      {format !== 'png' && (
        <SliderField
          label="画質"
          value={quality}
          onChange={setQuality}
          min={1}
          max={100}
          unit="%"
        />
      )}
      {format === 'jpeg' && (
        <>
          <p className="inline-note">JPEGでは透明部分が背景色になります。</p>
          <ColorField label="透明部分の背景色" value={matte} onChange={setMatte} />
        </>
      )}
    </>
  );
}
