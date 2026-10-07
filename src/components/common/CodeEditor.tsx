import { useId, type TextareaHTMLAttributes } from 'react';

export function CodeEditor({
  label,
  hint,
  'aria-describedby': describedBy,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="field editor-field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className="code-editor"
        aria-describedby={
          [hint && `${id}-hint`, describedBy].filter(Boolean).join(' ') || undefined
        }
        {...props}
      />
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}
