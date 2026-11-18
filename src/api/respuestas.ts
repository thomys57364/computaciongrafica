/**
 * Ayudas para leer las respuestas del backend. Están aquí y no en cada cliente (viajes, encomiendas…)
 * para que todos interpreten las respuestas de la misma forma.
 */

/**
 * Devuelve la lista que trae la respuesta. El backend suele mandar un arreglo, pero se tolera también
 * que venga envuelto, como { viajes: [...] } o { encomiendas: [...] }. Cualquier otra cosa da [].
 */
export function asList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  const inner = (data as Record<string, unknown> | null)?.[key];
  return Array.isArray(inner) ? (inner as T[]) : [];
}
