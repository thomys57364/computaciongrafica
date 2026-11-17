import { resumenCalificaciones, type ResumenCalificaciones } from '../utils/calificaciones';
import { apiClient } from './apiClient';

export const ratingsApi = {
  /** GET /api/ratings/:uid — calificaciones recibidas por un usuario (pública). */
  resumen: async (uid: string): Promise<ResumenCalificaciones> =>
    resumenCalificaciones(await apiClient.get<unknown>(`/api/ratings/${encodeURIComponent(uid)}`, { auth: false })),
};
