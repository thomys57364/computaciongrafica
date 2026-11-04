import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { encomiendasApi, type Encomienda } from '../api/encomiendasApi';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { CityField } from '../components/CityField';
import { LoadState } from '../components/LoadState';
import { Screen } from '../components/Screen';
import { SectionCard } from '../components/SectionCard';
import { SegmentedControl } from '../components/SegmentedControl';
import { TextAreaField } from '../components/TextAreaField';
import { TextField } from '../components/TextField';
import { TopBar } from '../components/TopBar';
import { useAsync } from '../hooks/useAsync';
import { useCiudades } from '../hooks/useCiudades';
import { useForm } from '../hooks/useForm';
import { errorMessage } from '../utils/errorMessage';
import { hayCambios, resolverCiudad } from '../utils/envios';
import { MAX_OBSERVACIONES, validateParcel, type ParcelFormValues } from '../utils/validation';

/** Datos con los que «Republicar» abre este formulario. */
export type PrefillEncomienda = Partial<ParcelFormValues>;

const MONEDAS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'COP', label: 'COP ($)' },
];

/**
 * Diseño Stitch «Nueva Encomienda». En /remitente/encomiendas/nueva publica una; en …/:id/editar corrige una
 * disponible. Al recargar la edición se pierde la encomienda de la navegación, así que se busca en
 * GET /api/encomiendas (no existe GET por id); si ya no está disponible se vuelve al Home con un aviso.
 */
export function NuevaEncomiendaScreen() {
  const { id } = useParams();
  const state = useLocation().state as { prefill?: PrefillEncomienda; editar?: Encomienda } | null;
  const desdeLista = state?.editar && state.editar._id === id ? state.editar : null;

  if (!id) return <EncomiendaForm editar={null} prefill={state?.prefill} />;
  if (desdeLista) return <EncomiendaForm editar={desdeLista} />;
  return <EditarDesdeLista id={id} />;
}

function EditarDesdeLista({ id }: { id: string }) {
  const { data, loading, error, reload } = useAsync(async () =>
    (await encomiendasApi.listar()).find((e) => e._id === id) ?? null,
  );
  if (loading || error) {
    return (
      <>
        <TopBar title="Editar encomienda" backTo="/remitente" />
        <Screen withTopBar className="pb-8 pt-3">
          <LoadState loading={loading} error={error} onRetry={reload} />
        </Screen>
      </>
    );
  }
  if (!data || data.estado !== 'disponible') {
    return (
      <Navigate
        to="/remitente"
        replace
        state={{ flash: 'Esa encomienda ya no se puede editar: solo se editan las disponibles.', flashTone: 'info' }}
      />
    );
  }
  return <EncomiendaForm editar={data} />;
}

function EncomiendaForm({ editar, prefill: prefillNueva }: { editar: Encomienda | null; prefill?: PrefillEncomienda }) {
  const navigate = useNavigate();
  // Editar: el backend no permite modificar una encomienda, así que se publica la corregida y se retira la anterior.
  const prefill: PrefillEncomienda | undefined = editar
    ? {
        ciudadOrigen: editar.ciudadOrigen,
        ciudadDestino: editar.ciudadDestino,
        observaciones: editar.observaciones ?? '',
        moneda: editar.moneda,
        valor: String(editar.valor),
      }
    : prefillNueva;
  const { ciudades, loading: loadingCiudades, failed: ciudadesFailed, retry } = useCiudades();

  const { values, setValues, errors, bind, validateNow } = useForm<ParcelFormValues>(
    {
      ciudadOrigen: prefill?.ciudadOrigen ?? '',
      ciudadDestino: prefill?.ciudadDestino ?? '',
      observaciones: prefill?.observaciones ?? '',
      moneda: prefill?.moneda ?? 'USD',
      valor: prefill?.valor ?? '',
    },
    (v) => validateParcel(v, ciudades),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateNow()) return;
    const datos = {
      ciudadOrigen: resolverCiudad(values.ciudadOrigen, ciudades) ?? values.ciudadOrigen.trim(),
      ciudadDestino: resolverCiudad(values.ciudadDestino, ciudades) ?? values.ciudadDestino.trim(),
      observaciones: values.observaciones.trim(),
      moneda: values.moneda,
      valor: Number(values.valor.replace(',', '.')),
    };
    if (editar && !hayCambios(editar, datos)) {
      setError('No hiciste ningún cambio.');
      return;
    }
    setSaving(true);
    try {
      await encomiendasApi.crear(datos);
      if (!editar) {
        navigate('/remitente', { replace: true, state: { flash: 'Encomienda publicada correctamente.' } });
        return;
      }
      // La nueva ya está publicada: ahora se retira la anterior (si falla, se avisa en lugar de ocultarlo).
      let flash = 'Encomienda actualizada correctamente.';
      try {
        await encomiendasApi.cambiarEstado(editar._id, 'vencida');
      } catch {
        flash = 'Publicamos los cambios, pero no pudimos retirar la versión anterior: verás las dos en «Disponibles».';
      }
      navigate('/remitente', { replace: true, state: { flash } });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  const cityPlaceholder = loadingCiudades ? 'Cargando ciudades…' : 'Escribe para buscar';

  return (
    <>
      <TopBar title={editar ? 'Editar encomienda' : 'Nueva encomienda'} backTo="/remitente" />
      <Screen withTopBar className="pb-8">
        <p className="pb-3 pt-3 text-body-md text-on-surface-variant">
          {editar
            ? 'Corrige los datos de tu encomienda. Publicaremos la versión nueva y retiraremos la anterior.'
            : 'Publica tu solicitud para conectar con viajeros verificados.'}
        </p>

        <form className="flex flex-col gap-space-md" onSubmit={onSubmit} noValidate>
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

          <SectionCard icon="flight_takeoff" title="Ruta del envío">
            <CityField
              label="Ciudad de origen"
              icon="flight_takeoff"
              placeholder={cityPlaceholder}
              ciudades={ciudades}
              disabled={saving}
              error={errors.ciudadOrigen}
              {...bind('ciudadOrigen')}
            />
            <CityField
              label="Ciudad de destino"
              icon="flight_land"
              placeholder={cityPlaceholder}
              ciudades={ciudades}
              disabled={saving}
              error={errors.ciudadDestino}
              {...bind('ciudadDestino')}
            />
          </SectionCard>

          <SectionCard icon="description" title="Detalles del paquete">
            <TextAreaField
              label="Observaciones"
              rows={4}
              placeholder="¿Qué envías y alguna indicación?"
              counterMax={MAX_OBSERVACIONES}
              disabled={saving}
              error={errors.observaciones}
              {...bind('observaciones')}
            />
          </SectionCard>

          <SectionCard icon="payments" title="Compensación al viajero">
            <SegmentedControl
              label="Moneda"
              options={MONEDAS}
              value={values.moneda}
              onChange={(moneda) => setValues((v) => ({ ...v, moneda }))}
              disabled={saving}
              error={errors.moneda}
            />
            <TextField
              label="Valor ofrecido"
              icon="attach_money"
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              placeholder="0"
              disabled={saving}
              error={errors.valor}
              {...bind('valor')}
            />
          </SectionCard>

          <div className="pt-space-sm">
            <Button type="submit" trailingIcon="arrow_forward" loading={saving} loadingText={editar ? 'Guardando…' : 'Publicando…'}>
              {editar ? 'Guardar cambios' : 'Publicar encomienda'}
            </Button>
          </div>
        </form>
      </Screen>
    </>
  );
}
