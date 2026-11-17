import { describe, expect, it } from 'vitest';
import type { Encomienda } from '../api/encomiendasApi';
import { resumenCalificaciones, textoCalificacion } from './calificaciones';
import { unirEncomiendas } from './envios';

const base: Encomienda = {
  _id: 'a1',
  ciudadOrigen: 'Bogota',
  ciudadDestino: 'Miami',
  moneda: 'USD',
  valor: 15,
  estado: 'disponible',
};

describe('Datos del remitente en la vista del viajero', () => {
  it('no pierde el uid cuando /disponibles repite una encomienda de /buscar', () => {
    const deBuscar = { ...base, uid: 'remitente-1', remitenteNombre: 'Harold' };
    const deDisponibles = { ...base, remitenteNombre: 'Harold' }; // /disponibles no trae uid
    expect(unirEncomiendas([deBuscar, deDisponibles])).toEqual([deBuscar]);
  });

  it('completa los campos que le faltan a la primera copia', () => {
    const sinNombre = { ...base, uid: 'remitente-1' };
    const conNombre = { ...base, remitenteNombre: 'Manuel' };
    expect(unirEncomiendas([sinNombre, conNombre])).toEqual([{ ...base, uid: 'remitente-1', remitenteNombre: 'Manuel' }]);
  });

  it('mantiene el orden y no mezcla encomiendas distintas', () => {
    const otra = { ...base, _id: 'b2' };
    expect(unirEncomiendas([base, otra, base]).map((e) => e._id)).toEqual(['a1', 'b2']);
  });
});

describe('Calificación de la otra persona', () => {
  it('lee la respuesta de GET /api/ratings/:uid', () => {
    expect(resumenCalificaciones({ total: 3, promedio: 4.666, calificaciones: [] })).toEqual({ total: 3, promedio: 4.666 });
    expect(resumenCalificaciones(null)).toEqual({ total: 0, promedio: 0 });
    expect(resumenCalificaciones({ total: 'x', promedio: null })).toEqual({ total: 0, promedio: 0 });
  });

  it('arma el texto con una cifra decimal', () => {
    expect(textoCalificacion({ total: 3, promedio: 4.666 })).toBe('4,7 · 3 calificaciones');
    expect(textoCalificacion({ total: 1, promedio: 5 })).toBe('5 · 1 calificación');
    expect(textoCalificacion({ total: 0, promedio: 0 })).toBe('Sin calificaciones todavía');
  });
});
