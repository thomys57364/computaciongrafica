import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/apiClient';
import { viajesApi } from '../api/viajesApi';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { CityField } from '../components/CityField';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { SectionCard } from '../components/SectionCard';
import { TextField } from '../components/TextField';
import { TopBar } from '../components/TopBar';
import { useAsync } from '../hooks/useAsync';
import { useCiudades } from '../hooks/useCiudades';
import { useForm } from '../hooks/useForm';
import { errorMessage } from '../utils/errorMessage';
import { hoyISO, normalizarVuelo, resolverCiudad, viajeActivo } from '../utils/envios';
import { validateTrip, type TripFormValues } from '../utils/validation';

const MENSAJE_VIAJE_ACTIVO =
  'Ya tienes un viaje activo. Cancélalo o márcalo como completado en «Mis viajes» para registrar otro.';

/** Diseño Stitch «Registrar Viaje»: número de vuelo, origen, destino y fecha. */
export function RegistrarViajeScreen() {
  const navigate = useNavigate();
  const { ciudades, loading: loadingCiudades, failed: ciudadesFailed, retry } = useCiudades();
  // Solo informativo: si no carga, el backend igual rechaza un segundo viaje activo (400).
  const { data: viajes } = useAsync(() => viajesApi.listar());
  const activo = useMemo(() => (viajes ? viajeActivo(viajes) : null), [viajes]);

  const hoy = hoyISO();
  const { values, errors, bind, validateNow } = useForm<TripFormValues>(
    { numeroVuelo: '', ciudadOrigen: '', ciudadDestino: '', fechaViaje: '' },
    (v) => validateTrip(v, ciudades, hoy),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateNow()) return;
    setSaving(true);
    try {
      await viajesApi.crear({
        numeroVuelo: normalizarVuelo(values.numeroVuelo),
        // Se envía el nombre oficial de la lista para que coincida con las búsquedas de encomiendas.
        ciudadOrigen: resolverCiudad(values.ciudadOrigen, ciudades) ?? values.ciudadOrigen.trim(),
        ciudadDestino: resolverCiudad(values.ciudadDestino, ciudades) ?? values.ciudadDestino.trim(),
        fechaViaje: values.fechaViaje,
      });
      navigate('/home/viajero', { replace: true, state: { flash: 'Viaje registrado correctamente.' } });
    } catch (err) {
      setError(err instanceof ApiError && err.status === 400 ? MENSAJE_VIAJE_ACTIVO : errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <>
      <TopBar title="Registrar viaje" backTo="/home/viajero" />
      <Screen withTopBar className="pb-8">
        <p className="pb-3 pt-3 text-body-md text-on-surface-variant">
          Ingresa los datos de tu próximo trayecto aéreo para habilitar la recepción de encomiendas.
        </p>

        <form className="flex flex-col gap-space-md" onSubmit={onSubmit} noValidate>
          {activo && (
            <Alert
              tone="info"
              action={
                <Link to="/viajero/viajes" className="font-semibold underline">
                  Ir a Mis viajes
                </Link>
              }
            >
              Ya tienes un viaje activo ({activo.ciudadOrigen} → {activo.ciudadDestino}). Solo puedes tener uno a la vez.
            </Alert>
          )}
          {error && <Alert>{error}</Alert>}
          {ciudadesFailed && (
            <Alert
              tone="info"
              action={
                <button type="button" onClick={retry} className="font-semibold underline">
                  Reintentar
                </button>
              }
            >
              No pudimos cargar la lista de ciudades. Puedes escribirlas a mano.
            </Alert>
          )}

          <SectionCard>
            <TextField
              label="Número de vuelo"
              icon="flight"
              placeholder="ej. AV 010"
              autoCapitalize="characters"
              autoComplete="off"
              disabled={saving}
              error={errors.numeroVuelo}
              {...bind('numeroVuelo')}
            />
            <CityField
              label="Ciudad de origen"
              icon="flight_takeoff"
              placeholder={loadingCiudades ? 'Cargando ciudades…' : 'Escribe para buscar'}
              ciudades={ciudades}
              disabled={saving}
              error={errors.ciudadOrigen}
              {...bind('ciudadOrigen')}
            />
            <CityField
              label="Ciudad de destino"
              icon="flight_land"
              placeholder={loadingCiudades ? 'Cargando ciudades…' : 'Escribe para buscar'}
              ciudades={ciudades}
              disabled={saving}
              error={errors.ciudadDestino}
              {...bind('ciudadDestino')}
            />
            <TextField
              label="Fecha del viaje"
              icon="calendar_today"
              type="date"
              min={hoy}
              disabled={saving}
              error={errors.fechaViaje}
              {...bind('fechaViaje')}
            />
          </SectionCard>

          <div className="mt-space-sm flex flex-col gap-3">
            <Button
              type="submit"
              trailingIcon="arrow_forward"
              loading={saving}
              loadingText="Registrando viaje…"
              disabled={!!activo}
            >
              Registrar viaje
            </Button>
            <div className="flex items-center gap-2.5 rounded-control bg-field p-3.5">
              <Icon name="info" className="text-[20px] text-air" />
              <p className="text-body-sm font-semibold text-on-surface">Solo puedes tener un viaje activo a la vez</p>
            </div>
          </div>
        </form>

        <footer className="mt-space-lg flex flex-col gap-2 pb-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-outline">
            <Icon name="lock" className="text-[16px]" />
            <span className="text-label-caps uppercase">Verificación segura Lapticon</span>
          </div>
          <p className="px-2 text-body-sm text-on-surface-variant">
            Tus itinerarios se procesan de forma privada y solo se comparten los detalles confirmados al aceptar encargos.
          </p>
        </footer>
      </Screen>
    </>
  );
}
