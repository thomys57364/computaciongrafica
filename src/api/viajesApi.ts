import { consultarRuta, viajeDeRespuesta } from '../utils/envios';
import { ApiError, apiClient } from './apiClient';
import { asList } from './respuestas';

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

/** Viaje disponible visto por un remitente (no trae id ni estado; sí el nombre del viajero). */
export interface ViajeDisponible {
  uid: string;
  nombreUsuario: string;
  ciudadOrigen: string;
  ciudadDestino: string;
  fechaViaje: string;
}

export const viajesApi = {
  /** GET /api/viajes/disponible — mi viaje disponible (null si no tengo; un 404 también significa «ninguno»). */
  activo: async (): Promise<Viaje | null> => {
    try {
      return viajeDeRespuesta(await apiClient.get<unknown>('/api/viajes/disponible'));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },
  /** GET /api/viajes/disponibles — viajes disponibles de otros usuarios en una ruta (pública). */
  disponiblesEnRuta: (ciudadOrigen: string, ciudadDestino: string) =>
    consultarRuta(
      ciudadOrigen,
      ciudadDestino,
      async (o, d) =>
        asList<ViajeDisponible>(
          await apiClient.get<unknown>(
            `/api/viajes/disponibles?ciudadOrigen=${encodeURIComponent(o)}&ciudadDestino=${encodeURIComponent(d)}`,
            { auth: false },
          ),
          'viajes',
        ),
      (v) => `${v.uid}|${v.fechaViaje}|${v.ciudadOrigen}|${v.ciudadDestino}`,
    ),
  /** POST /api/viajes — 400 si el usuario ya tiene un viaje disponible. */
  crear: (data: NuevoViaje) => apiClient.post<Viaje>('/api/viajes', data),
  /** GET /api/viajes — todos mis viajes. */
  listar: async () => asList<Viaje>(await apiClient.get<unknown>('/api/viajes'), 'viajes'),
  /** PATCH /api/viajes/:id/estado — solo el dueño. */
  cambiarEstado: (id: string, estado: EstadoViaje) =>
    apiClient.patch<unknown>(`/api/viajes/${encodeURIComponent(id)}/estado`, { estado }),
};
