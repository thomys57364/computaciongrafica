/** Resumen de las calificaciones que recibió un usuario (GET /api/ratings/:uid). */
export interface ResumenCalificaciones {
  total: number;
  promedio: number;
}

/** Toma { total, promedio, calificaciones } del backend y lo deja en números (0 si falta algo). */
export function resumenCalificaciones(data: unknown): ResumenCalificaciones {
  const r = (data ?? {}) as { total?: unknown; promedio?: unknown };
  const total = Number(r.total);
  const promedio = Number(r.promedio);
  return {
    total: Number.isFinite(total) && total > 0 ? Math.floor(total) : 0,
    promedio: Number.isFinite(promedio) && promedio > 0 ? promedio : 0,
  };
}

/** "4,5 · 3 calificaciones", "5 · 1 calificación" o "Sin calificaciones todavía". */
export function textoCalificacion({ total, promedio }: ResumenCalificaciones): string {
  if (total === 0) return 'Sin calificaciones todavía';
  const nota = promedio.toLocaleString('es-CO', { maximumFractionDigits: 1 });
  return `${nota} · ${total} ${total === 1 ? 'calificación' : 'calificaciones'}`;
}
