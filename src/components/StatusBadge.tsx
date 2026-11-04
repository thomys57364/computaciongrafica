import { Icon } from './Icon';

export type BadgeTone = 'info' | 'done' | 'muted' | 'danger';

const TONES: Record<BadgeTone, string> = {
  info: 'bg-chip text-navy',
  done: 'bg-success-bg text-success-strong',
  muted: 'bg-divider text-on-surface-variant',
  danger: 'bg-error-bg text-wine',
};

/** Etiqueta de estado (Disponible, Tomada, Vencida…). */
export function StatusBadge({ tone = 'info', icon, children }: { tone?: BadgeTone; icon?: string; children: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-label-caps uppercase ${TONES[tone]}`}
    >
      {icon && <Icon name={icon} filled className="text-[14px]" />}
      {children}
    </span>
  );
}
