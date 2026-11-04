import { describe, expect, it } from 'vitest';
import { totalesPorMoneda } from '../components/TomadasDelViaje';

describe('Encomiendas de un viaje', () => {
  it('suma el valor por moneda', () => {
    expect(
      totalesPorMoneda([
        { moneda: 'USD', valor: 20 },
        { moneda: 'COP', valor: 50000 },
        { moneda: 'USD', valor: 15 },
      ]),
    ).toEqual([
      { moneda: 'USD', total: 35 },
      { moneda: 'COP', total: 50000 },
    ]);
    expect(totalesPorMoneda([])).toEqual([]);
  });
});
