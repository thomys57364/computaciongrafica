import type { ReactNode } from 'react';
import { Alert } from './Alert';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

/** Estado de carga / error de una lista: spinner mientras carga y aviso con «Reintentar» si falla. */
export function LoadState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-space-lg text-body-md text-on-surface-variant" role="status">
        <Spinner className="h-4 w-4 text-navy" />
        Cargando…
      </div>
    );
  }
  if (error) {
    return (
      <Alert
        action={
          <button type="button" onClick={onRetry} className="font-semibold underline">
            Reintentar
          </button>
        }
      >
        {error}
      </Alert>
    );
  }
  return null;
}

/** Mensaje de lista vacía con ícono. */
export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card bg-card p-space-lg text-center shadow-card">
      <Icon name={icon} className="text-[32px] text-navy-soft" />
      <p className="text-title-md text-navy">{title}</p>
      {children && <p className="text-body-md text-on-surface-variant">{children}</p>}
    </div>
  );
}
