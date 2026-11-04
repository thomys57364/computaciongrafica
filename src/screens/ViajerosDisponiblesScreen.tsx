import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { encomiendasApi } from '../api/encomiendasApi';
import { viajesApi, type ViajeDisponible } from '../api/viajesApi';
import { useAuth } from '../auth/AuthContext';
import { initials } from '../components/Avatar';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { CityField } from '../components/CityField';
import { Icon } from '../components/Icon';
import { EmptyState } from '../components/LoadState';
import { Alert } from '../components/Alert';
import { RouteStrip } from '../components/RouteStrip';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { useAsync } from '../hooks/useAsync';
import { useCiudades } from '../hooks/useCiudades';
import { errorMessage } from '../utils/errorMessage';
import { formatearFecha, normalizar, resolverCiudad, rutasUnicas, type Ruta } from '../utils/envios';
import { validateCity } from '../utils/validation';

interface Resultado {
  ruta: Ruta;
  viajes: ViajeDisponible[];
}

/** Para el remitente: viajes activos (disponibles) de otros usuarios en una ruta. */
export function ViajerosDisponiblesScreen() {
  const { user } = useAuth();
  const { ciudades, loading: loadingCiudades } = useCiudades();
  const { data: encomiendas } = useAsync(() => encomiendasApi.listar());
  const rutas = useMemo(
    () => rutasUnicas((encomiendas ?? []).filter((e) => e.estado === 'disponible')),
    [encomiendas],
  );

  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [errors, setErrors] = useState<{ origen?: string; destino?: string }>({});
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const autoSearched = useRef(false);

  const buscar = async (o: string, d: string) => {
    const eOrigen = validateCity(o, ciudades, 'origen');
    const eDestino = validateCity(d, ciudades, 'destino');
    setErrors({ origen: eOrigen ?? undefined, destino: eDestino ?? undefined });
    if (eOrigen || eDestino) return;
    const ruta = { origen: resolverCiudad(o, ciudades) ?? o.trim(), destino: resolverCiudad(d, ciudades) ?? d.trim() };
    setOrigen(ruta.origen);
    setDestino(ruta.destino);
    setSearchError(null);
    setSearching(true);
    try {
      const viajes = await viajesApi.disponiblesEnRuta(ruta.origen, ruta.destino);
      const ajenos = viajes
        .filter((v) => v.uid !== user?.uid)
        .sort((a, b) => (a.fechaViaje ?? '').localeCompare(b.fechaViaje ?? ''));
      setResultado({ ruta, viajes: ajenos });
    } catch (err) {
      setSearchError(errorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  // Al abrir la pantalla, busca de una vez la primera ruta de las encomiendas del usuario.
  useEffect(() => {
    if (autoSearched.current || rutas.length === 0) return;
    autoSearched.current = true;
    void buscar(rutas[0].origen, rutas[0].destino);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rutas]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void buscar(origen, destino);
  };

  const placeholder = loadingCiudades ? 'Cargando ciudades…' : 'Escribe para buscar';

  return (
    <>
      <TopBar title="Viajeros disponibles" backTo="/home/remitente" />
      <Screen withTopBar className="gap-space-md pb-24">
        <p className="pt-3 text-body-md text-on-surface-variant">
          Mira quién viaja por tu ruta y lleva encomiendas.
        </p>

        {rutas.length > 0 && (
          <section className="flex flex-col gap-2">
            <span className="text-label-caps font-bold uppercase text-on-surface-variant">Tus rutas</span>
            <div className="flex flex-wrap gap-2">
              {rutas.map((r) => {
                const activa =
                  normalizar(r.origen) === normalizar(origen) && normalizar(r.destino) === normalizar(destino);
                return (
                  <button
                    key={`${r.origen}>${r.destino}`}
                    type="button"
                    onClick={() => void buscar(r.origen, r.destino)}
                    disabled={searching}
                    className={`rounded-control px-3 py-2 text-label-md transition-colors disabled:opacity-60 ${
                      activa ? 'bg-navy text-white' : 'bg-field text-navy hover:bg-field-focus'
                    }`}
                  >
                    {r.origen} → {r.destino}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-card bg-card p-space-md shadow-card">
          <CityField
            label="Ciudad de origen"
            icon="flight_takeoff"
            placeholder={placeholder}
            ciudades={ciudades}
            disabled={searching}
            error={errors.origen}
            name="origen"
            value={origen}
            onChange={(e) => setOrigen(e.target.value)}
          />
          <CityField
            label="Ciudad de destino"
            icon="flight_land"
            placeholder={placeholder}
            ciudades={ciudades}
            disabled={searching}
            error={errors.destino}
            name="destino"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
          />
          <Button type="submit" trailingIcon="search" loading={searching} loadingText="Buscando…">
            Buscar viajeros
          </Button>
        </form>

        {searchError && <Alert>{searchError}</Alert>}

        {resultado && !searching && (
          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-title-md font-bold text-on-surface">
                {resultado.viajes.length} {resultado.viajes.length === 1 ? 'viajero' : 'viajeros'} en esta ruta
              </h2>
            </div>
            {resultado.viajes.length === 0 ? (
              <EmptyState icon="luggage" title="Aún no hay viajeros en esta ruta">
                Tu encomienda seguirá visible y un viajero podrá tomarla cuando registre un viaje.
              </EmptyState>
            ) : (
              resultado.viajes.map((v, i) => {
                const [nombre = '', ...resto] = (v.nombreUsuario ?? '').split(' ');
                return (
                  <article
                    key={`${v.uid}-${v.fechaViaje}-${i}`}
                    className="flex flex-col gap-3 rounded-card bg-card p-space-md shadow-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-title-md text-white">
                        {initials(nombre, resto.join(' '))}
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-title-md font-bold text-on-surface">
                          {v.nombreUsuario || 'Viajero'}
                        </span>
                        <span className="flex items-center gap-1 text-label-md text-on-surface-variant">
                          <Icon name="calendar_today" className="text-[14px]" />
                          Viaja el {formatearFecha(v.fechaViaje)}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-control bg-field p-3">
                      <RouteStrip origen={v.ciudadOrigen} destino={v.ciudadDestino} />
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}
      </Screen>
      <BottomNav rol="remitente" />
    </>
  );
}
