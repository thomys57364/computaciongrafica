import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { encomiendasApi } from '../api/encomiendasApi';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { CityField } from '../components/CityField';
import { Screen } from '../components/Screen';
import { SectionCard } from '../components/SectionCard';
import { SegmentedControl } from '../components/SegmentedControl';
import { TextAreaField } from '../components/TextAreaField';
import { TextField } from '../components/TextField';
import { TopBar } from '../components/TopBar';
import { useCiudades } from '../hooks/useCiudades';
import { useForm } from '../hooks/useForm';
import { errorMessage } from '../utils/errorMessage';
import { resolverCiudad } from '../utils/envios';
import { MAX_OBSERVACIONES, validateParcel, type ParcelFormValues } from '../utils/validation';

/** Datos con los que «Republicar» abre este formulario. */
export type PrefillEncomienda = Partial<ParcelFormValues>;

const MONEDAS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'COP', label: 'COP ($)' },
];

/** Diseño Stitch «Nueva Encomienda»: ruta, detalles del paquete y compensación al viajero. */
export function NuevaEncomiendaScreen() {
  const navigate = useNavigate();
  const prefill = (useLocation().state as { prefill?: PrefillEncomienda } | null)?.prefill;
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
    setSaving(true);
    try {
      await encomiendasApi.crear({
        ciudadOrigen: resolverCiudad(values.ciudadOrigen, ciudades) ?? values.ciudadOrigen.trim(),
        ciudadDestino: resolverCiudad(values.ciudadDestino, ciudades) ?? values.ciudadDestino.trim(),
        observaciones: values.observaciones.trim(),
        moneda: values.moneda,
        valor: Number(values.valor.replace(',', '.')),
      });
      navigate('/home/remitente', { replace: true, state: { flash: 'Encomienda publicada correctamente.' } });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  const cityPlaceholder = loadingCiudades ? 'Cargando ciudades…' : 'Escribe para buscar';

  return (
    <>
      <TopBar title="Nueva encomienda" backTo="/home/remitente" />
      <Screen withTopBar className="pb-8">
        <p className="pb-3 pt-3 text-body-md text-on-surface-variant">
          Publica tu solicitud para conectar con viajeros verificados.
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
            <Button type="submit" trailingIcon="arrow_forward" loading={saving} loadingText="Publicando…">
              Publicar encomienda
            </Button>
          </div>
        </form>
      </Screen>
    </>
  );
}
