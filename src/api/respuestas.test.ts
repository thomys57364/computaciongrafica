import { describe, expect, it } from 'vitest';
import { asList } from './respuestas';

describe('asList', () => {
  it('devuelve el arreglo tal cual', () => {
    expect(asList<number>([1, 2], 'viajes')).toEqual([1, 2]);
  });

  it('saca la lista cuando viene envuelta', () => {
    expect(asList<number>({ viajes: [3] }, 'viajes')).toEqual([3]);
  });

  it('da [] con respuestas vacías o de otra forma', () => {
    expect(asList(null, 'viajes')).toEqual([]);
    expect(asList({ encomiendas: [1] }, 'viajes')).toEqual([]);
    expect(asList({ viajes: 'x' }, 'viajes')).toEqual([]);
  });
});
