import type { Encomienda } from '../api/encomiendasApi';
import { formatearValor } from '../utils/envios';
import { Icon } from './Icon';

/** Suma los valores por moneda: [{ moneda: 'USD', total: 70 }, …]. */
export function totalesPorMoneda(lista: Pick<Encomienda, 'moneda' | 'valor'>[]): { moneda: string; total: number }[] {
  const mapa = new Map<string, number>();
  for (const e of lista) mapa.set(e.moneda, (mapa.get(e.moneda) ?? 0) + (Number(e.valor) || 0));
  return [...mapa.entries()].map(([moneda, total]) => ({ moneda, total }));
}

/** Encomiendas que el viajero tomó para su viaje, dentro de la tarjeta del viaje. */
export function TomadasDelViaje({ tomadas, onOpen }: { tomadas: Encomienda[]; onOpen: (e: Encomienda) => void }) {
  if (tomadas.length === 0) {
    return (
      <p className="rounded-control bg-field p-3 text-body-sm text-on-surface-variant">
        Aún no has tomado encomiendas para este viaje.
      </p>
    );
  }
  const totales = totalesPorMoneda(tomadas);
  return (
    <div className="flex flex-col gap-2 rounded-control bg-field p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-label-caps font-bold uppercase text-on-surface-variant">
          <Icon name="inventory_2" className="text-[16px] text-wine" />
          Encomiendas de este viaje ({tomadas.length})
        </span>
        <span className="text-label-md font-bold text-wine">
          {totales.map((t) => formatearValor(t.total, t.moneda)).join(' + ')}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {tomadas.map((e) => (
          <li key={e._id}>
            <button
              type="button"
              onClick={() => onOpen(e)}
              className="flex w-full items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 text-left shadow-card"
            >
              <span className="min-w-0 truncate text-body-sm text-on-surface">{e.observaciones || 'Sin observaciones'}</span>
              <span className="flex shrink-0 items-center gap-1 text-label-md font-semibold text-wine">
                {formatearValor(e.valor, e.moneda)}
                <Icon name="chevron_right" className="text-[18px] text-on-surface-variant" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
