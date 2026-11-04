import type { Encomienda, EstadoEncomienda } from '../api/encomiendasApi';
import type { EstadoViaje, Viaje } from '../api/viajesApi';

/** Quita tildes y pasa a minúsculas para comparar ciudades ("Bogotá" == "bogota"). */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Busca `texto` en la lista de ciudades del backend (ignorando tildes y mayúsculas) y devuelve el nombre
 * oficial. Es importante enviar siempre el nombre oficial: la búsqueda de viajes y encomiendas compara textos.
 */
export function resolverCiudad(texto: string, ciudades: string[]): string | null {
  const buscado = normalizar(texto);
  if (!buscado) return null;
  return ciudades.find((c) => normalizar(c) === buscado) ?? null;
}

/** Número de vuelo en mayúsculas y sin espacios sobrantes: "av  010" → "AV 010". */
export function normalizarVuelo(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ').toUpperCase();
}

/**
 * Primera fecha (YYYY-MM-DD) que se puede elegir para un viaje.
 * El backend guarda la fecha a medianoche UTC y marca como completado lo que ya pasó. En Colombia (UTC-5),
 * pasadas las 7 p. m. «mañana» ya es hoy en UTC, así que el viaje nacía completado. Por eso se exige
 * una fecha posterior al día UTC actual.
 */
export function fechaMinimaViaje(now = new Date()): string {
  const manana = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return manana.toISOString().slice(0, 10);
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * "2026-12-01T00:00:00.000Z" → "1 Dic 2026". Se lee en UTC porque el backend guarda la fecha a medianoche UTC;
 * en hora local de Colombia se vería el día anterior.
 */
export function formatearFecha(iso: string | undefined): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return `${fecha.getUTCDate()} ${MESES[fecha.getUTCMonth()]} ${fecha.getUTCFullYear()}`;
}

export function formatearValor(valor: number, moneda: string): string {
  return `${Number.isFinite(valor) ? valor.toLocaleString('es-CO') : valor} ${moneda}`;
}

/** Un viaje "activo" es el que todavía puede recibir encomiendas. */
export function esViajeActivo(v: Pick<Viaje, 'estado'>): boolean {
  return v.estado === 'disponible' || v.estado === 'contactado';
}

export function viajeActivo(viajes: Viaje[]): Viaje | null {
  return viajes.find(esViajeActivo) ?? null;
}

export const ETIQUETA_VIAJE: Record<EstadoViaje, string> = {
  disponible: 'Disponible',
  contactado: 'Contactado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export const ETIQUETA_ENCOMIENDA: Record<EstadoEncomienda, string> = {
  disponible: 'Disponible',
  tomada: 'Tomada',
  vencida: 'Vencida',
  recibida: 'Recibida',
};

/** Reparte las encomiendas por pestaña del Home del remitente. */
export function agruparEncomiendas(lista: Encomienda[]): Record<EstadoEncomienda, Encomienda[]> {
  const grupos: Record<EstadoEncomienda, Encomienda[]> = { disponible: [], tomada: [], vencida: [], recibida: [] };
  for (const e of lista) (grupos[e.estado] ?? grupos.disponible).push(e);
  return grupos;
}
