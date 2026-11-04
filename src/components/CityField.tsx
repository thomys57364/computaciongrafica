import { useId, useMemo, type ChangeEvent } from 'react';
import { normalizar } from '../utils/envios';
import { TextField, type FieldChrome } from './TextField';

interface CityFieldProps extends FieldChrome {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  ciudades: string[];
  disabled?: boolean;
  placeholder?: string;
}

const MAX_SUGERENCIAS = 30;

/**
 * Campo de ciudad con autocompletado nativo (<datalist>). La lista del backend tiene miles de ciudades,
 * así que solo se renderizan las que coinciden con lo escrito (primero las que empiezan por el texto).
 */
export function CityField({ ciudades, value, ...rest }: CityFieldProps) {
  const listId = useId();
  const sugerencias = useMemo(() => {
    const q = normalizar(value);
    if (q.length < 2) return [];
    const empiezan: string[] = [];
    const contienen: string[] = [];
    for (const c of ciudades) {
      const n = normalizar(c);
      if (n.startsWith(q)) empiezan.push(c);
      else if (n.includes(q)) contienen.push(c);
      if (empiezan.length >= MAX_SUGERENCIAS) break;
    }
    return [...empiezan, ...contienen].slice(0, MAX_SUGERENCIAS);
  }, [ciudades, value]);

  return (
    <>
      <TextField {...rest} value={value} list={listId} autoComplete="off" autoCapitalize="words" spellCheck={false} />
      <datalist id={listId}>
        {sugerencias.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </>
  );
}
