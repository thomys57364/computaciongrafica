import { apiClient } from './apiClient';

export type EstadoViaje = 'disponible' | 'completado' | 'cancelado' | 'contactado';

export interface Viaje {
  _id: string;
  uid: string;
  numeroVuelo: string;
  ciudadOrigen: string;
  ciudadDestino: string;
  fechaViaje: string;
  estado: EstadoViaje;
}

export interface NuevoViaje {
  numeroVuelo: string;
  ciudadOrigen: string;
  ciudadDestino: string;
  /** Fecha en formato YYYY-MM-DD. */
  fechaViaje: string;
}

/** El backend devuelve un arreglo; se tolera también { viajes: [...] } por si cambia. */
function asList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  const inner = (data as Record<string, unknown> | null)?.[key];
  return Array.isArray(inner) ? (inner as T[]) : [];
}

export const viajesApi = {
  /** POST /api/viajes — 400 si el usuario ya tiene un viaje disponible. */
  crear: (data: NuevoViaje) => apiClient.post<Viaje>('/api/viajes', data),
  /** GET /api/viajes — todos mis viajes. */
  listar: async () => asList<Viaje>(await apiClient.get<unknown>('/api/viajes'), 'viajes'),
  /** PATCH /api/viajes/:id/estado — solo el dueño. */
  cambiarEstado: (id: string, estado: EstadoViaje) =>
    apiClient.patch<unknown>(`/api/viajes/${encodeURIComponent(id)}/estado`, { estado }),
};
