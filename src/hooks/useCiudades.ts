import { useCallback, useEffect, useState } from 'react';
import { getCiudades } from '../api/ciudadesApi';

/** Lista de ciudades para el autocompletado. Si falla, los formularios siguen funcionando con texto libre. */
export function useCiudades() {
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    getCiudades()
      .then((list) => active && setCiudades(list))
      .catch(() => active && setFailed(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ciudades, loading, failed, retry };
}
