import type { ReactNode } from 'react';
import { Icon } from './Icon';

/** Tarjeta blanca de formulario con encabezado de ícono + título (Nueva encomienda / Registrar viaje). */
export function SectionCard({ icon, title, children }: { icon?: string; title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-card bg-card p-space-md shadow-card">
      {title && (
        <div className="flex items-center gap-2 border-b border-divider pb-2">
          {icon && (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-field text-navy">
              <Icon name={icon} className="text-[18px]" />
            </span>
          )}
          <h2 className="text-title-md text-navy">{title}</h2>
        </div>
      )}
      {children}
    </section>
  );
}
