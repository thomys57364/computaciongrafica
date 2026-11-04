import { describe, expect, it } from 'vitest';
import type { Encomienda } from '../api/encomiendasApi';
import { MENSAJE_VIAJE_ACTIVO, agruparEncomiendas, mensajeErrorViaje, viajeDeRespuesta } from './envios';
import { backendMessage, errorMessage } from './errorMessage';
import { unwrapProfile } from './profileDiff';

/** Imita un ApiError sin cargar apiClient (que importa Firebase). */
function apiError(status: number, detail: unknown, message = 'Mensaje genérico') {
  return Object.assign(new Error(message), { name: 'ApiError', kind: 'http', status, detail });
}

describe('backendMessage / errorMessage', () => {
  it('lee { error } o { message } del cuerpo', () => {
    expect(backendMessage(apiError(400, { error: 'Falta fechaViaje' }))).toBe('Falta fechaViaje');
    expect(backendMessage(apiError(400, { message: ' Datos inválidos ' }))).toBe('Datos inválidos');
    expect(backendMessage(apiError(400, '<html>'))).toBeNull();
    expect(backendMessage(new Error('x'))).toBeNull();
  });

  it('usa el texto del backend solo en 400/409', () => {
    expect(errorMessage(apiError(400, { error: 'Falta fechaViaje' }))).toBe('Falta fechaViaje');
    expect(errorMessage(apiError(400, null))).toBe('Mensaje genérico');
    expect(errorMessage(apiError(500, { error: 'stack interno' }))).toBe('Mensaje genérico');
  });
});

describe('mensajeErrorViaje', () => {
  it('traduce el 400 de «ya tienes un viaje disponible»', () => {
    expect(mensajeErrorViaje(apiError(400, { error: 'Ya tienes un viaje disponible' }))).toBe(MENSAJE_VIAJE_ACTIVO);
    expect(mensajeErrorViaje(apiError(400, null))).toBe(MENSAJE_VIAJE_ACTIVO);
  });

  it('muestra otros 400 tal como los explica el backend', () => {
    expect(mensajeErrorViaje(apiError(400, { error: 'La fecha debe ser futura' }))).toBe('La fecha debe ser futura');
  });

  it('otros errores usan el mensaje general', () => {
    expect(mensajeErrorViaje(apiError(500, null, 'El servidor tuvo un problema.'))).toBe('El servidor tuvo un problema.');
  });
});

describe('viajeDeRespuesta', () => {
  const viaje = { _id: 'v1', estado: 'disponible' };
  it('acepta el viaje, { viaje } o un arreglo', () => {
    expect(viajeDeRespuesta(viaje)?._id).toBe('v1');
    expect(viajeDeRespuesta({ viaje })?._id).toBe('v1');
    expect(viajeDeRespuesta([viaje])?._id).toBe('v1');
  });
  it('sin viaje devuelve null', () => {
    expect(viajeDeRespuesta(null)).toBeNull();
    expect(viajeDeRespuesta([])).toBeNull();
    expect(viajeDeRespuesta({ mensaje: 'No tienes viajes' })).toBeNull();
  });
});

describe('unwrapProfile', () => {
  const perfil = { nombre: 'Ana', apellido: 'Ruiz', telefono: '300', nacionalidad: 'Colombia' };
  it('deja igual un perfil plano', () => {
    expect(unwrapProfile(perfil)).toEqual(perfil);
  });
  it('saca el perfil de { usuario }, { user } o { data }', () => {
    expect(unwrapProfile({ usuario: perfil })).toEqual(perfil);
    expect(unwrapProfile({ user: perfil })).toEqual(perfil);
    expect(unwrapProfile({ data: { usuario: perfil } })).toEqual(perfil);
  });
  it('sin datos devuelve null', () => {
    expect(unwrapProfile(null)).toBeNull();
    expect(unwrapProfile('')).toBeNull();
  });
});

describe('agruparEncomiendas', () => {
  it('no muestra las eliminadas (estado «cancelada»)', () => {
    const e = (_id: string, estado: string) => ({ _id, estado }) as unknown as Encomienda;
    const grupos = agruparEncomiendas([e('a', 'disponible'), e('b', 'cancelada')]);
    expect(grupos.disponible.map((x) => x._id)).toEqual(['a']);
    expect(Object.values(grupos).flat()).toHaveLength(1);
  });
});
