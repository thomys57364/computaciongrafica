import type { Encomienda, EstadoEncomienda } from '../api/encomiendasApi';
import type { EstadoViaje, Viaje } from '../api/viajesApi';
import { backendMessage, errorMessage } from './errorMessage';

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

/** Quita las tildes conservando mayúsculas: "Bogotá" → "Bogota". */
export function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * El backend compara ciudades sin distinguir mayúsculas pero SÍ distinguiendo tildes ("Bogotá" no encuentra
 * "Bogota"), y hay datos guardados de las dos formas. Para no perder coincidencias se consulta con ambas.
 */
export function variantes(texto: string): string[] {
  const limpio = texto.trim();
  return [...new Set([limpio, sinTildes(limpio)])];
}

/**
 * Consulta una ruta con todas las combinaciones de tildes de origen/destino y une los resultados sin repetir
 * (`clave` identifica un elemento). Si todas las consultas fallan, propaga el primer error.
 */
export async function consultarRuta<T>(
  origen: string,
  destino: string,
  consultar: (o: string, d: string) => Promise<T[]>,
  clave: (item: T) => string,
): Promise<T[]> {
  const pares = variantes(origen).flatMap((o) => variantes(destino).map((d) => [o, d] as const));
  const resultados = await Promise.allSettled(pares.map(([o, d]) => consultar(o, d)));
  const ok = resultados.filter((r): r is PromiseFulfilledResult<T[]> => r.status === 'fulfilled');
  if (ok.length === 0) throw (resultados[0] as PromiseRejectedResult).reason;
  const vistos = new Map<string, T>();
  for (const r of ok) for (const item of r.value) if (!vistos.has(clave(item))) vistos.set(clave(item), item);
  return [...vistos.values()];
}

/** Identificador corto para mostrar: "#ENC-84920A" (últimos 6 caracteres del _id). */
export function idCorto(id: string): string {
  return `#ENC-${id.slice(-6).toUpperCase()}`;
}

export interface Ruta {
  origen: string;
  destino: string;
}

/** Rutas distintas (sin importar tildes/mayúsculas) de una lista de encomiendas. */
export function rutasUnicas(lista: Pick<Encomienda, 'ciudadOrigen' | 'ciudadDestino'>[]): Ruta[] {
  const vistas = new Set<string>();
  const rutas: Ruta[] = [];
  for (const e of lista) {
    const clave = `${normalizar(e.ciudadOrigen)}>${normalizar(e.ciudadDestino)}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    rutas.push({ origen: e.ciudadOrigen, destino: e.ciudadDestino });
  }
  return rutas;
}

/**
 * Junta encomiendas que llegan de varias consultas sin perder datos. Si la misma encomienda aparece dos veces,
 * se queda la primera y solo se le completan los campos que no traía (p. ej. /disponibles omite el `uid`).
 */
export function unirEncomiendas(lista: Encomienda[]): Encomienda[] {
  const porId = new Map<string, Encomienda>();
  for (const e of lista) porId.set(e._id, { ...e, ...porId.get(e._id) });
  return [...porId.values()];
}

/** Estado de una encomienda que el remitente eliminó (el backend no las borra). */
export const ESTADO_ELIMINADA = 'cancelada';

/** Reparte las encomiendas por pestaña del Home del remitente (las eliminadas no aparecen). */
export function agruparEncomiendas(lista: Encomienda[]): Record<EstadoEncomienda, Encomienda[]> {
  const grupos: Record<EstadoEncomienda, Encomienda[]> = { disponible: [], tomada: [], vencida: [], recibida: [] };
  for (const e of lista) {
    if ((e.estado as string) === ESTADO_ELIMINADA) continue;
    (grupos[e.estado] ?? grupos.disponible).push(e);
  }
  return grupos;
}

/** ¿Los datos del formulario difieren de la encomienda original? (ignora tildes, mayúsculas y espacios) */
export function hayCambios(
  original: Pick<Encomienda, 'ciudadOrigen' | 'ciudadDestino' | 'observaciones' | 'moneda' | 'valor'>,
  nuevos: { ciudadOrigen: string; ciudadDestino: string; observaciones?: string; moneda: string; valor: number },
): boolean {
  return (
    normalizar(original.ciudadOrigen) !== normalizar(nuevos.ciudadOrigen) ||
    normalizar(original.ciudadDestino) !== normalizar(nuevos.ciudadDestino) ||
    (original.observaciones ?? '').trim() !== (nuevos.observaciones ?? '').trim() ||
    original.moneda !== nuevos.moneda ||
    Number(original.valor) !== nuevos.valor
  );
}

export const MENSAJE_VIAJE_ACTIVO =
  'Ya tienes un viaje activo. Cancélalo o márcalo como completado en «Mis viajes» para registrar otro.';

/**
 * Mensaje para un error al crear un viaje. El backend responde 400 tanto por «ya tienes un viaje disponible»
 * como por datos inválidos: se distinguen por el texto que manda.
 */
export function mensajeErrorViaje(err: unknown): string {
  const status = (err as { status?: unknown } | null)?.status;
  if (!(err instanceof Error) || err.name !== 'ApiError' || status !== 400) return errorMessage(err);
  const detalle = backendMessage(err);
  if (!detalle || /ya tienes|viaje (disponible|activo)/i.test(detalle)) return MENSAJE_VIAJE_ACTIVO;
  return detalle;
}

/**
 * Interpreta GET /api/viajes/disponible. La forma de la respuesta sin viaje no está documentada, así que se
 * acepta: el viaje, { viaje }, un arreglo, o vacío/null (sin viaje activo).
 */
export function viajeDeRespuesta(data: unknown): Viaje | null {
  const candidato = Array.isArray(data) ? data[0] : (data as Record<string, unknown> | null)?.viaje ?? data;
  return candidato && typeof candidato === 'object' && typeof (candidato as Viaje)._id === 'string'
    ? (candidato as Viaje)
    : null;
}
