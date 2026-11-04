import { useEffect, useState } from 'react';
import type { Encomienda } from '../api/encomiendasApi';
import { viajesApi, type ViajeDisponible } from '../api/viajesApi';
import { rutasUnicas } from '../utils/envios';

/**
 * Nombre y fecha del viajero que tomó cada encomienda. El backend solo guarda su uid (`viajeroId`), así que se
 * busca en los viajes de la misma ruta (GET /api/viajes/disponibles trae el nombre). Si no aparece, la tarjeta
 * muestra un texto genérico.
 */
export function useViajerosDeTomadas(encomiendas: Encomienda[]): Record<string, ViajeDisponible> {
  const [viajeros, setViajeros] = useState<Record<string, ViajeDisponible>>({});
  useEffect(() => {
    const conViajero = encomiendas.filter((e) => e.viajeroId && (e.estado === 'tomada' || e.estado === 'recibida'));
    if (conViajero.length === 0) return;
    let active = true;
    void Promise.allSettled(rutasUnicas(conViajero).map((r) => viajesApi.disponiblesEnRuta(r.origen, r.destino))).then(
      (resultados) => {
        if (!active) return;
        const mapa: Record<string, ViajeDisponible> = {};
        for (const r of resultados) {
          if (r.status !== 'fulfilled') continue;
          for (const v of r.value) mapa[v.uid] ??= v;
        }
        setViajeros(mapa);
      },
    );
    return () => {
      active = false;
    };
  }, [encomiendas]);
  return viajeros;
}
