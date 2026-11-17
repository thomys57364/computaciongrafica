import { useCalificacion } from '../hooks/useCalificacion';
import { textoCalificacion } from '../utils/calificaciones';
import { Icon } from './Icon';

interface PersonaCardProps {
  /** Título en mayúsculas de la tarjeta: «Publicado por», «Viajero asignado»… */
  etiqueta: string;
  nombre: string;
  detalle: string;
  /** uid de la persona, para mostrar su calificación (GET /api/ratings/:uid). Sin uid no se muestra. */
  uid?: string | null;
}

/** La otra persona de la encomienda: el remitente (vista viajero) o el viajero que la tomó (vista remitente). */
export function PersonaCard({ etiqueta, nombre, detalle, uid }: PersonaCardProps) {
  const calificacion = useCalificacion(uid);
  return (
    <section className="flex flex-col gap-3 rounded-card bg-card p-space-md shadow-card">
      <span className="text-label-caps font-bold uppercase text-on-surface-variant">{etiqueta}</span>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-white">
          <Icon name="person" className="text-[24px]" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-title-md text-on-surface">{nombre}</span>
          <span className="text-label-md text-on-surface-variant">{detalle}</span>
          {calificacion && (
            <span className="mt-0.5 flex items-center gap-1 text-label-md text-on-surface-variant">
              <Icon name="star" filled className="text-[16px] text-navy-soft" />
              {textoCalificacion(calificacion)}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
