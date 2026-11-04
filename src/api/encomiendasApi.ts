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

export const encomiendasApi = {
  /** POST /api/encomiendas */
  crear: (data: NuevaEncomienda) => apiClient.post<Encomienda>('/api/encomiendas', data),
  /** GET /api/encomiendas — mis encomiendas como remitente. */
  listar: async () => asList<Encomienda>(await apiClient.get<unknown>('/api/encomiendas'), 'encomiendas'),
  /** GET /api/encomiendas/disponibles2 — encomiendas disponibles de otros remitentes en una ruta. */
  disponiblesEnRuta: async (ciudadOrigen: string, ciudadDestino: string) =>
    asList<Encomienda>(
      await apiClient.get<unknown>(
        `/api/encomiendas/disponibles2?ciudadOrigen=${encodeURIComponent(ciudadOrigen)}&ciudadDestino=${encodeURIComponent(ciudadDestino)}`,
      ),
      'encomiendas',
    ),
  /** GET /api/encomiendas/buscar — disponibles y tomadas por mí (viajero) en una ruta. */
  buscar: async (origen: string, destino: string) => {
    const data = await apiClient.get<{ disponibles?: unknown; tomadas?: unknown } | null>(
      `/api/encomiendas/buscar?origen=${encodeURIComponent(origen)}&destino=${encodeURIComponent(destino)}`,
    );
    return {
      disponibles: Array.isArray(data?.disponibles) ? (data.disponibles as Encomienda[]) : [],
      tomadas: Array.isArray(data?.tomadas) ? (data.tomadas as Encomienda[]) : [],
    };
  },
  /** PUT /api/encomiendas/tomar/:id — el viajero toma una encomienda disponible. */
  tomar: (id: string) => apiClient.put<unknown>(`/api/encomiendas/tomar/${encodeURIComponent(id)}`, undefined),
  /** PUT /api/encomiendas/:id/estado — remitente o viajero asignado. */
  cambiarEstado: (id: string, estado: EstadoEncomienda) =>
    apiClient.put<unknown>(`/api/encomiendas/${encodeURIComponent(id)}/estado`, { estado }),
};
