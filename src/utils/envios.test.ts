import { describe, expect, it } from 'vitest';
import type { Encomienda } from '../api/encomiendasApi';
import type { Viaje } from '../api/viajesApi';
import { ordenarCiudades } from '../api/ciudadesApi';
import {
  agruparEncomiendas,
  formatearFecha,
  formatearValor,
  fechaMinimaViaje,
  consultarRuta,
  idCorto,
  rutasUnicas,
  variantes,
  normalizarVuelo,
  resolverCiudad,
  viajeActivo,
} from './envios';
import { validateParcel, validateTrip } from './validation';

const CIUDADES = ['Bogotá', 'Madrid', 'Miami', 'Medellin'];
const MIN = '2026-11-04';

describe('Utilidades de envíos', () => {
  it('resuelve ciudades ignorando tildes y mayúsculas', () => {
    expect(resolverCiudad('bogota', CIUDADES)).toBe('Bogotá');
    expect(resolverCiudad('  MADRID ', CIUDADES)).toBe('Madrid');
    expect(resolverCiudad('Narnia', CIUDADES)).toBeNull();
    expect(resolverCiudad('', CIUDADES)).toBeNull();
  });

  it('normaliza el número de vuelo', () => {
    expect(normalizarVuelo('  av   010 ')).toBe('AV 010');
  });

  it('formatea fechas en UTC y valores', () => {
    expect(formatearFecha('2026-12-01T00:00:00.000Z')).toBe('1 Dic 2026');
    expect(formatearFecha(undefined)).toBe('');
    expect(formatearFecha('no-es-fecha')).toBe('');
    expect(formatearValor(20, 'USD')).toBe('20 USD');
  });

  it('la fecha mínima de viaje es el día siguiente en UTC', () => {
    // 4 Nov 00:30 UTC (7:30 p. m. del 3 en Colombia): «mañana» local ya sería hoy en UTC.
    expect(fechaMinimaViaje(new Date('2026-11-04T00:30:00Z'))).toBe('2026-11-05');
    expect(fechaMinimaViaje(new Date('2026-11-03T15:00:00Z'))).toBe('2026-11-04');
    expect(fechaMinimaViaje(new Date('2026-12-31T12:00:00Z'))).toBe('2027-01-01');
  });

  it('encuentra el viaje activo (disponible o contactado)', () => {
    const base = { _id: '1', uid: 'u', numeroVuelo: 'AA1', ciudadOrigen: 'a', ciudadDestino: 'b', fechaViaje: '' };
    const viajes: Viaje[] = [
      { ...base, _id: '1', estado: 'cancelado' },
      { ...base, _id: '2', estado: 'disponible' },
    ];
    expect(viajeActivo(viajes)?._id).toBe('2');
    expect(viajeActivo([viajes[0]])).toBeNull();
  });

  it('agrupa las encomiendas por estado', () => {
    const e = (estado: Encomienda['estado']): Encomienda => ({
      _id: estado,
      uid: 'u',
      ciudadOrigen: 'a',
      ciudadDestino: 'b',
      moneda: 'USD',
      valor: 1,
      estado,
    });
    const grupos = agruparEncomiendas([e('disponible'), e('tomada'), e('tomada'), e('vencida')]);
    expect(grupos.disponible).toHaveLength(1);
    expect(grupos.tomada).toHaveLength(2);
    expect(grupos.recibida).toHaveLength(0);
  });

  it('genera un id corto y rutas únicas', () => {
    expect(idCorto('65f1c0ffee84920a')).toBe('#ENC-84920A');
    const r = rutasUnicas([
      { ciudadOrigen: 'Bogotá', ciudadDestino: 'Miami' },
      { ciudadOrigen: 'bogota', ciudadDestino: 'MIAMI' },
      { ciudadOrigen: 'Cali', ciudadDestino: 'Madrid' },
    ]);
    expect(r).toEqual([
      { origen: 'Bogotá', destino: 'Miami' },
      { origen: 'Cali', destino: 'Madrid' },
    ]);
  });

  it('genera variantes con y sin tildes', () => {
    expect(variantes('Bogotá')).toEqual(['Bogotá', 'Bogota']);
    expect(variantes(' Cali ')).toEqual(['Cali']);
  });

  it('consulta todas las variantes y une los resultados sin repetir', async () => {
    const llamadas: string[] = [];
    const datos: Record<string, { id: string }[]> = {
      'Bogotá>Miami': [{ id: 'a' }],
      'Bogota>Miami': [{ id: 'a' }, { id: 'b' }],
    };
    const r = await consultarRuta(
      'Bogotá',
      'Miami',
      async (o, d) => {
        llamadas.push(`${o}>${d}`);
        return datos[`${o}>${d}`] ?? [];
      },
      (x) => x.id,
    );
    expect(llamadas).toHaveLength(2);
    expect(r.map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('si todas las consultas fallan propaga el error; si una funciona, la usa', async () => {
    await expect(
      consultarRuta('Bogotá', 'Miami', async () => Promise.reject(new Error('caído')), (x: { id: string }) => x.id),
    ).rejects.toThrow('caído');
    const r = await consultarRuta(
      'Bogotá',
      'Miami',
      async (o) => (o === 'Bogota' ? [{ id: 'z' }] : Promise.reject(new Error('x'))),
      (x) => x.id,
    );
    expect(r).toEqual([{ id: 'z' }]);
  });

  it('ordena y limpia la lista de ciudades', () => {
    expect(ordenarCiudades(['Cali', ' Bogotá ', 'Cali', '', 3])).toEqual(['Bogotá', 'Cali']);
    expect(ordenarCiudades(null)).toEqual([]);
  });
});

describe('Validación de viaje', () => {
  const ok = { numeroVuelo: 'AV 010', ciudadOrigen: 'Bogotá', ciudadDestino: 'Madrid', fechaViaje: '2026-12-01' };

  it('acepta un viaje válido', () => {
    expect(validateTrip(ok, CIUDADES, MIN)).toEqual({});
  });

  it('acepta vuelos sin espacio y con minúsculas', () => {
    expect(validateTrip({ ...ok, numeroVuelo: 'aa123' }, CIUDADES, MIN).numeroVuelo).toBeUndefined();
  });

  it('rechaza vuelo inválido, ciudades fuera de lista, mismo origen/destino y fechas pasadas', () => {
    expect(validateTrip({ ...ok, numeroVuelo: '' }, CIUDADES, MIN).numeroVuelo).toBeDefined();
    expect(validateTrip({ ...ok, numeroVuelo: 'hola' }, CIUDADES, MIN).numeroVuelo).toBeDefined();
    expect(validateTrip({ ...ok, ciudadOrigen: 'Narnia' }, CIUDADES, MIN).ciudadOrigen).toBeDefined();
    expect(validateTrip({ ...ok, ciudadDestino: 'bogota' }, CIUDADES, MIN).ciudadDestino).toMatch(/distinto/);
    expect(validateTrip({ ...ok, fechaViaje: '2026-11-03' }, CIUDADES, MIN).fechaViaje).toBeDefined();
    expect(validateTrip({ ...ok, fechaViaje: MIN }, CIUDADES, MIN).fechaViaje).toBeUndefined();
  });

  it('si la lista de ciudades no cargó acepta texto libre', () => {
    expect(validateTrip({ ...ok, ciudadOrigen: 'Narnia' }, [], MIN).ciudadOrigen).toBeUndefined();
  });
});

describe('Validación de encomienda', () => {
  const ok = { ciudadOrigen: 'Bogotá', ciudadDestino: 'Miami', observaciones: 'Caja pequeña', moneda: 'USD', valor: '20' };

  it('acepta una encomienda válida', () => {
    expect(validateParcel(ok, CIUDADES)).toEqual({});
    expect(validateParcel({ ...ok, valor: '12,5' }, CIUDADES).valor).toBeUndefined();
  });

  it('rechaza valor vacío, cero o negativo', () => {
    expect(validateParcel({ ...ok, valor: '' }, CIUDADES).valor).toBeDefined();
    expect(validateParcel({ ...ok, valor: '0' }, CIUDADES).valor).toBeDefined();
    expect(validateParcel({ ...ok, valor: '-5' }, CIUDADES).valor).toBeDefined();
    expect(validateParcel({ ...ok, valor: 'abc' }, CIUDADES).valor).toBeDefined();
  });

  it('exige observaciones (máx. 300) y moneda válida', () => {
    expect(validateParcel({ ...ok, observaciones: '  ' }, CIUDADES).observaciones).toBeDefined();
    expect(validateParcel({ ...ok, observaciones: 'x'.repeat(301) }, CIUDADES).observaciones).toBeDefined();
    expect(validateParcel({ ...ok, moneda: 'EUR' }, CIUDADES).moneda).toBeDefined();
  });

  it('rechaza el mismo origen y destino', () => {
    expect(validateParcel({ ...ok, ciudadDestino: 'bogota' }, CIUDADES).ciudadDestino).toMatch(/distinto/);
  });
});
