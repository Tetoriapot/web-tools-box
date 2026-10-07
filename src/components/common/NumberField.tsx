import { useId } from 'react';

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 'any',
  hint,
  invalid = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step?: number | 'any';
  hint?: string;
  invalid?: boolean;
}) {
  const id = useId();
  const number = Number(value);
  const inputError =
    !value.trim() || !Number.isFinite(number)
      ? '数値を入力してください。'
      : number < min || number > max
        ? `${min.toLocaleString()}〜${max.toLocaleString()}の範囲で入力してください。`
        : step === 1 && !Number.isInteger(number)
          ? '整数で入力してください。'
          : '';
  const description = [hint && `${id}-hint`, inputError && `${id}-error`].filter(Boolean).join(' ');
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode={step === 1 ? 'numeric' : 'decimal'}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || !!inputError}
        aria-describedby={description || undefined}
      />
      {inputError && (
        <span className="field-error" id={`${id}-error`}>
          {inputError}
        </span>
      )}
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}
