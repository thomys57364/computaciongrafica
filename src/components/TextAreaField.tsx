import { useId, type TextareaHTMLAttributes } from 'react';
import { FieldError, FieldHint, FieldLabel, fieldBoxClass, type FieldChrome } from './TextField';

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldChrome {
  /** Muestra "n/máx" bajo el campo. */
  counterMax?: number;
}

export function TextAreaField({
  label,
  error,
  hint,
  labelAction,
  labelStyle = 'caps',
  tone = 'tinted',
  counterMax,
  id,
  className = '',
  value,
  ...rest
}: TextAreaFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const length = typeof value === 'string' ? value.length : 0;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <FieldLabel htmlFor={fieldId} label={label} labelStyle={labelStyle} action={labelAction} />
      <div className={`rounded-control transition-colors ${fieldBoxClass(tone, !!error)}`}>
        <textarea
          id={fieldId}
          value={value}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className="w-full resize-none rounded-control bg-transparent p-3.5 text-body-md text-on-surface placeholder:text-muted focus:outline-none disabled:opacity-60"
          {...rest}
        />
      </div>
      {error ? <FieldError id={errorId} error={error} /> : <FieldHint id={hintId} hint={hint} />}
      {counterMax !== undefined && (
        <span className={`pr-1 text-right text-label-md ${length > counterMax ? 'text-wine' : 'text-muted'}`}>
          {length}/{counterMax}
        </span>
      )}
    </div>
  );
}
