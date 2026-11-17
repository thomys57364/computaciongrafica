import { useEffect, useState } from 'react';
import { ratingsApi } from '../api/ratingsApi';
import type { ResumenCalificaciones } from '../utils/calificaciones';

/**
 * Calificación de un usuario (remitente o viajero). Es un dato de apoyo: si no hay uid o la consulta falla,
 * devuelve null y la tarjeta simplemente no muestra la línea de calificación.
 */
export function useCalificacion(uid: string | null | undefined): ResumenCalificaciones | null {
  const [resumen, setResumen] = useState<ResumenCalificaciones | null>(null);
  useEffect(() => {
    setResumen(null);
    if (!uid) return;
    let active = true;
    ratingsApi
      .resumen(uid)
      .then((r) => active && setResumen(r))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [uid]);
  return resumen;
}
