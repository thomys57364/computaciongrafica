import { unwrapProfile } from '../utils/profileDiff';
import { ApiError, apiClient } from './apiClient';

export interface ProfileData {
  nombre: string;
  apellido: string;
  telefono: string;
  nacionalidad: string;
}

/** Perfil tal como lo devuelve el backend (puede traer campos extra). */
export type UserProfile = Partial<ProfileData> & Record<string, unknown>;

/** Las respuestas pueden venir envueltas ({ usuario: {...} }): se entregan siempre planas. */
function plano(data: unknown): UserProfile {
  const profile = unwrapProfile(data) as UserProfile;
  // Solo en desarrollo: si el backend cambia la forma, se ve en consola en vez de un formulario vacío.
  if (import.meta.env.DEV && profile && !('nombre' in profile)) {
    console.warn('[Lapticon] La respuesta del perfil no trae "nombre":', data);
  }
  return profile;
}

export const usersApi = {
  /** POST /api/users/register — el backend lo trata como "registrar/actualizar", así que reintentar es seguro. */
  register: async (data: ProfileData) => plano(await apiClient.post<unknown>('/api/users/register', data)),
  get: async (uid: string) => plano(await apiClient.get<unknown>(`/api/users/${encodeURIComponent(uid)}`)),
  update: async (uid: string, data: Partial<ProfileData>) =>
    plano(await apiClient.put<unknown>(`/api/users/${encodeURIComponent(uid)}`, data)),
};

export type ProfileLookup = { status: 'complete'; profile: UserProfile } | { status: 'missing' };

/**
 * Interpreta la respuesta de GET /api/users/:uid.
 * AISLADO A PROPÓSITO: aún no está verificado qué responde el backend cuando el
 * usuario existe en Firebase pero no tiene perfil. Supuesto actual:
 *   - 404                      → falta el perfil ("completar perfil")
 *   - 200 con cuerpo vacío     → falta el perfil
 *   - 200 con datos            → perfil completo
 *   - cualquier otro error     → se propaga (la UI ofrece "Reintentar")
 * Si el backend responde distinto, ajusta solo esta función.
 */
export async function lookupProfile(uid: string): Promise<ProfileLookup> {
  try {
    const profile = await usersApi.get(uid);
    const isEmpty = !profile || (typeof profile === 'object' && Object.keys(profile).length === 0);
    return isEmpty ? { status: 'missing' } : { status: 'complete', profile };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return { status: 'missing' };
    throw err;
  }
}
