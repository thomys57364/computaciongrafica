import { apiClient } from './apiClient';

let cache: Promise<string[]> | null = null;

/** Quita vacíos/duplicados y ordena en español. */
export function ordenarCiudades(data: unknown): string[] {
  const lista = Array.isArray(data)
    ? data.filter((c): c is string => typeof c === 'string' && c.trim() !== '').map((c) => c.trim())
    : [];
  return [...new Set(lista)].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}

/** GET /api/ciudades/ciudades (pública). Se cachea en memoria durante la sesión. */
export function getCiudades(): Promise<string[]> {
  if (!cache) {
    cache = apiClient.get<unknown>('/api/ciudades/ciudades', { auth: false }).then(ordenarCiudades);
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}
