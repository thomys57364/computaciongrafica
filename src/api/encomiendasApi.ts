import { consultarRuta, unirEncomiendas } from '../utils/envios';
import { ApiError, apiClient } from './apiClient';

export type EstadoEncomienda = 'disponible' | 'tomada' | 'vencida' | 'recibida';

export interface Encomienda {
  _id: string;
  /** uid del remitente. GET /api/encomiendas/disponibles no lo trae; /buscar y GET /api/encomiendas sí. */
  uid?: string;
  /** Nombre de quien publicó la encomienda. Solo lo traen /disponibles y /buscar (vista del viajero). */
  remitenteNombre?: string;
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

/** GET /api/encomiendas/disponibles?origen=&destino= — encomiendas disponibles en una ruta (endpoint documentado). */
async function disponiblesDocumentado(origen: string, destino: string): Promise<Encomienda[]> {
  return asList<Encomienda>(
    await apiClient.get<unknown>(
      `/api/encomiendas/disponibles?origen=${encodeURIComponent(origen)}&destino=${encodeURIComponent(destino)}`,
    ),
    'encomiendas',
  );
}

/** GET /api/encomiendas/disponibles2 — variante sin documentar; solo respaldo si la documentada falla. */
async function disponibles2(ciudadOrigen: string, ciudadDestino: string): Promise<Encomienda[]> {
  return asList<Encomienda>(
    await apiClient.get<unknown>(
      `/api/encomiendas/disponibles2?ciudadOrigen=${encodeURIComponent(ciudadOrigen)}&ciudadDestino=${encodeURIComponent(ciudadDestino)}`,
    ),
    'encomiendas',
  );
}

/** Disponibles en una ruta: el endpoint documentado y, si falla, /disponibles2. */
async function disponiblesRaw(origen: string, destino: string): Promise<Encomienda[]> {
  try {
    return await disponiblesDocumentado(origen, destino);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.kind === 'no-session')) throw err;
    return disponibles2(origen, destino);
  }
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
   * /disponibles (o /disponibles2 si esa falla) y prueba las variantes con y sin tildes.
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
    // Primero las de /buscar: traen el uid del remitente, que /disponibles omite.
    const disponibles = unirEncomiendas([
      ...(buscadas ?? []).filter((x) => !x.tomada).map((x) => x.e),
      ...(sueltas ?? []),
    ]).filter((e) => e.estado === 'disponible' && !ids.has(e._id));
    return { disponibles, tomadas };
  },
  /** PUT /api/encomiendas/tomar/:id — el viajero toma una encomienda disponible. */
  tomar: (id: string) => apiClient.put<unknown>(`/api/encomiendas/tomar/${encodeURIComponent(id)}`, undefined),
  /** PUT /api/encomiendas/:id/estado — remitente o viajero asignado. */
  cambiarEstado: (id: string, estado: EstadoEncomienda | 'cancelada') =>
    apiClient.put<unknown>(`/api/encomiendas/${encodeURIComponent(id)}/estado`, { estado }),
  /**
   * El backend no tiene DELETE: «eliminar» es pasar la encomienda a «cancelada» (como en la colección de Postman).
   * Las canceladas no se muestran en ninguna lista.
   */
  eliminar: (id: string) =>
    apiClient.put<unknown>(`/api/encomiendas/${encodeURIComponent(id)}/estado`, { estado: 'cancelada' }),
};
