import type { ProfileFormValues } from './validation';

export const PROFILE_FIELDS = ['nombre', 'apellido', 'telefono', 'nacionalidad'] as const;

const ENVOLTORIOS = ['usuario', 'user', 'perfil', 'profile', 'data'] as const;

/**
 * El backend puede devolver el perfil plano ({ nombre, ... }) o envuelto ({ usuario: { nombre, ... } },
 * { data: ... }). Devuelve siempre el objeto que tiene los campos del perfil.
 */
export function unwrapProfile(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const obj = data as Record<string, unknown>;
  if (PROFILE_FIELDS.some((k) => k in obj)) return obj;
  for (const key of ENVOLTORIOS) {
    const inner = obj[key];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      const found = unwrapProfile(inner);
      if (found) return found;
    }
  }
  return obj;
}

/** Valores del formulario a partir del perfil del backend (los campos que falten quedan vacíos). */
export function profileToForm(profile: Record<string, unknown> | null | undefined): ProfileFormValues {
  const read = (key: string) => (typeof profile?.[key] === 'string' ? (profile[key] as string) : '');
  return { nombre: read('nombre'), apellido: read('apellido'), telefono: read('telefono'), nacionalidad: read('nacionalidad') };
}

/** Solo los campos que cambiaron respecto al original (comparando sin espacios sobrantes). */
export function changedFields(original: ProfileFormValues, current: ProfileFormValues): Partial<ProfileFormValues> {
  const changes: Partial<ProfileFormValues> = {};
  for (const field of PROFILE_FIELDS) {
    const next = current[field].trim();
    if (next !== original[field].trim()) changes[field] = next;
  }
  return changes;
}
