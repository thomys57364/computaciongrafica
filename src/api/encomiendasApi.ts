import { consultarRuta } from '../utils/envios';
import { apiClient } from './apiClient';

export type EstadoEncomienda = 'disponible' | 'tomada' | 'vencida' | 'recibida';

export interface Encomienda {
  _id: string;
  uid: string;
  ciudadOrigen: string;
  ciudadDestino: string;
  observaciones?: string;
  moneda: string;
  valor: number;
  estado: EstadoEncomienda;
  viajeroId?: string | null;
  fechaCreacion?: string;
  fechaVencimiento?: string;
}

export interface NuevaEncomienda {
  ciudadOrigen: string;
  ciudadDestino: string;
  observaciones?: string;
  moneda: string;
  valor: number;
}

function asList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  const inner = (data as Record<string, unknown> | null)?.[key];
  return Array.isArray(inner) ? (inner as T[]) : [];
}

/** GET /api/encomiendas/disponibles2 — encomiendas disponibles en una ruta (filtros opcionales). */
async function disponiblesRaw(ciudadOrigen: string, ciudadDestino: string): Promise<Encomienda[]> {
  return asList<Encomienda>(
    await apiClient.get<unknown>(
      `/api/encomiendas/disponibles2?ciudadOrigen=${encodeURIComponent(ciudadOrigen)}&ciudadDestino=${encodeURIComponent(ciudadDestino)}`,
    ),
    'encomiendas',
  );
}

/** GET /api/encomiendas/buscar — disponibles y tomadas por mí (viajero) en una ruta. */
async function buscarRaw(origen: string, destino: string) {
  const data = await apiClient.get<{ disponibles?: unknown; tomadas?: unknown } | null>(
    `/api/encomiendas/buscar?origen=${encodeURIComponent(origen)}&destino=${encodeURIComponent(destino)}`,
  );
  return {
    disponibles: Array.isArray(data?.disponibles) ? (data.disponibles as Encomienda[]) : [],
    tomadas: Array.isArray(data?.tomadas) ? (data.tomadas as Encomienda[]) : [],
  };
}

export const encomiendasApi = {
  /** POST /api/encomiendas */
  crear: (data: NuevaEncomienda) => apiClient.post<Encomienda>('/api/encomiendas', data),
  /** GET /api/encomiendas — mis encomiendas como remitente. */
  listar: async () => asList<Encomienda>(await apiClient.get<unknown>('/api/encomiendas'), 'encomiendas'),
  disponiblesEnRuta: disponiblesRaw,
  buscar: buscarRaw,
  /**
   * Todo lo que un viajero debe ver en su ruta: combina /buscar (disponibles + tomadas por mí) con
   * /disponibles2 (que no excluye ninguna disponible) y prueba las variantes con y sin tildes.
   */
  enRuta: async (origen: string, destino: string) => {
    const [buscadas, sueltas] = await Promise.all([
      consultarRuta(origen, destino, async (o, d) => {
        const r = await buscarRaw(o, d);
        return [...r.disponibles.map((e) => ({ e, tomada: false })), ...r.tomadas.map((e) => ({ e, tomada: true }))];
      }, (x) => x.e._id).catch(() => null),
      consultarRuta(origen, destino, disponiblesRaw, (e) => e._id).catch(() => null),
    ]);
    if (buscadas === null && sueltas === null) throw new Error('No se pudieron cargar las encomiendas.');
    const tomadas = (buscadas ?? []).filter((x) => x.tomada).map((x) => x.e);
    const ids = new Set(tomadas.map((e) => e._id));
    const disponibles = new Map<string, Encomienda>();
    for (const e of [...(buscadas ?? []).filter((x) => !x.tomada).map((x) => x.e), ...(sueltas ?? [])]) {
      if (e.estado === 'disponible' && !ids.has(e._id)) disponibles.set(e._id, e);
    }
    return { disponibles: [...disponibles.values()], tomadas };
  },
  /** PUT /api/encomiendas/tomar/:id — el viajero toma una encomienda disponible. */
  tomar: (id: string) => apiClient.put<unknown>(`/api/encomiendas/tomar/${encodeURIComponent(id)}`, undefined),
  /** PUT /api/encomiendas/:id/estado — remitente o viajero asignado. */
  cambiarEstado: (id: string, estado: EstadoEncomienda) =>
    apiClient.put<unknown>(`/api/encomiendas/${encodeURIComponent(id)}/estado`, { estado }),
};
