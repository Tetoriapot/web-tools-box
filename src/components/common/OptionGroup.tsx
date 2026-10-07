import { useId } from 'react';

export function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
  grid = false,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (value: T) => void;
  grid?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <div className={grid ? 'case-options' : 'segmented'}>
        {options.map((option) => (
          <label key={option.id}>
            <input
              type="radio"
              name={name}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
