interface SegmentedControlProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
}

/** Selector de 2-4 opciones en píldora (p. ej. moneda USD / COP). */
export function SegmentedControl({ label, options, value, onChange, disabled, error }: SegmentedControlProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label-caps uppercase text-on-surface">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid gap-2 rounded-control bg-field p-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(o.value)}
              className={`h-10 rounded-lg text-label-md transition-all disabled:opacity-60 ${
                selected ? 'bg-navy text-white shadow-card' : 'text-navy hover:bg-field-focus'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {error && <p className="pl-1 text-label-md text-wine">{error}</p>}
    </div>
  );
}
