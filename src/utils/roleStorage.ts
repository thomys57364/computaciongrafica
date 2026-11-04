/** Cache local del rol elegido (por usuario). localStorage puede fallar en modo privado: nunca rompe la app. */

export type Rol = 'remitente' | 'viajero';

const key = (uid: string) => `lapticon:rol:${uid}`;

/** Sin rol guardado (primer ingreso) se entra como remitente; el modo se cambia desde el encabezado del Home. */
export const ROL_POR_DEFECTO: Rol = 'remitente';

export const roleStorage = {
  /** Rol guardado o, si no hay, el rol por defecto. */
  actual(uid: string): Rol {
    return this.get(uid) ?? ROL_POR_DEFECTO;
  },
  get(uid: string): Rol | null {
    try {
      const value = localStorage.getItem(key(uid));
      return value === 'remitente' || value === 'viajero' ? value : null;
    } catch {
      return null;
    }
  },
  set(uid: string, rol: Rol) {
    try {
      localStorage.setItem(key(uid), rol);
    } catch {
      /* sin almacenamiento disponible: el rol se pedirá de nuevo */
    }
  },
  clear(uid: string) {
    try {
      localStorage.removeItem(key(uid));
    } catch {
      /* ignorar */
    }
  },
};
