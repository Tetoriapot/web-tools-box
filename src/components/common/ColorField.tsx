import { useId } from 'react';
import { normalizeHex } from '../../lib/colors';

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const hex = normalizeHex(value);
  return (
    <div className="field">
      <label htmlFor={`${id}-hex`}>{label}</label>
      <div className="color-control">
        <input
          aria-label={`${label} カラーピッカー`}
          type="color"
          value={hex ?? '#000000'}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          id={`${id}-hex`}
          type="text"
          value={value}
          spellCheck={false}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            if (hex) onChange(hex);
          }}
          aria-invalid={!hex}
          aria-describedby={!hex ? `${id}-error` : undefined}
        />
      </div>
      {!hex && (
        <span id={`${id}-error`} className="field-error">
          3桁または6桁のHEXで入力してください。
        </span>
      )}
    </div>
  );
}
