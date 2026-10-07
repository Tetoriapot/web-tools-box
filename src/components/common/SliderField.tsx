import { useId } from 'react';

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = 'px',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  const id = useId();
  return (
    <div className="field slider-field">
      <div className="slider-label">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>
          {value}
          <span>{unit}</span>
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.valueAsNumber)}
        aria-valuetext={`${value}${unit}`}
      />
    </div>
  );
}
