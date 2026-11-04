import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/apiClient';
import { encomiendasApi, type Encomienda } from '../api/encomiendasApi';
import { viajesApi } from '../api/viajesApi';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { EmptyState, LoadState } from '../components/LoadState';
import { RouteStrip } from '../components/RouteStrip';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useAsync } from '../hooks/useAsync';
import { errorMessage } from '../utils/errorMessage';
import {
  ETIQUETA_ENCOMIENDA,
  formatearFecha,
  formatearValor,
  idCorto,
  normalizar,
  viajeActivo,
} from '../utils/envios';

const MENSAJE_NO_DISPONIBLE = 'Esta encomienda ya fue tomada por otro viajero o venció.';

/** Diseño Stitch «Detalle de Encomienda (Vista Viajero)»: ver la encomienda y tomarla para tu viaje. */
export function EncomiendaViajeroScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fromList = (useLocation().state as { encomienda?: Encomienda } | null)?.encomienda;

  const { data, loading, error, reload } = useAsync(async () => {
    const activo = viajeActivo(await viajesApi.listar());
    let encomienda: Encomienda | null = fromList && fromList._id === id ? fromList : null;
    // Si se abrió el enlace directamente (sin pasar por la lista) se busca en la ruta del viaje activo.
    if (!encomienda && activo && id) {
      const { disponibles, tomadas } = await encomiendasApi.enRuta(activo.ciudadOrigen, activo.ciudadDestino);
      encomienda = [...disponibles, ...tomadas].find((e) => e._id === id) ?? null;
    }
    return { activo, encomienda };
  });

  const [taking, setTaking] = useState(false);
  const [takeError, setTakeError] = useState<string | null>(null);

  const activo = data?.activo ?? null;
  const e = data?.encomienda ?? null;
  const coincide =
    !!activo &&
    !!e &&
    normalizar(activo.ciudadOrigen) === normalizar(e.ciudadOrigen) &&
    normalizar(activo.ciudadDestino) === normalizar(e.ciudadDestino);

  const tomar = async () => {
    if (!e) return;
    setTakeError(null);
    setTaking(true);
    try {
      await encomiendasApi.tomar(e._id);
      navigate('/home/viajero', {
        replace: true,
        state: { flash: 'Encomienda tomada. Coordina la entrega con el remitente.' },
      });
    } catch (err) {
      setTakeError(err instanceof ApiError && err.status === 400 ? MENSAJE_NO_DISPONIBLE : errorMessage(err));
      setTaking(false);
    }
  };

  return (
    <>
      <TopBar title="Detalle de encomienda" backTo="/home/viajero" />
      <Screen withTopBar className="gap-space-md pb-8">
        <div className="pt-3" />
        <LoadState loading={loading} error={error} onRetry={reload} />

        {!loading && !error && !e && (
          <EmptyState icon="inventory_2" title="No encontramos esta encomienda">
            Puede que ya no esté disponible o que no sea de tu ruta.
          </EmptyState>
        )}

        {!loading && !error && e && (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <span className="text-label-caps uppercase text-on-surface-variant">ID</span>
                <span className="rounded-lg bg-chip px-2 py-0.5 text-label-lg text-on-surface">{idCorto(e._id)}</span>
              </span>
              {e.estado === 'disponible' ? (
                coincide && (
                  <span className="flex items-center gap-1 rounded-full bg-field-focus px-2.5 py-1 text-label-md text-navy">
                    <Icon name="flight_takeoff" filled className="text-[16px] text-navy-soft" />
                    Coincide con tu ruta
                  </span>
                )
              ) : (
                <StatusBadge tone="info" icon="check_circle">
                  {ETIQUETA_ENCOMIENDA[e.estado] ?? e.estado}
                </StatusBadge>
              )}
            </div>

            <section className="flex flex-col gap-3 rounded-card bg-card p-space-md shadow-card">
              {activo && (
                <div className="flex items-center justify-between text-label-md text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-wine" />
                    Tu vuelo: <strong className="text-label-lg text-on-surface">{activo.numeroVuelo}</strong>
                  </span>
                  <span className="rounded-md bg-field px-2 py-0.5 text-on-surface">{formatearFecha(activo.fechaViaje)}</span>
                </div>
              )}
              <RouteStrip origen={e.ciudadOrigen} destino={e.ciudadDestino} />
            </section>

            <section className="flex flex-col gap-1 rounded-card bg-navy p-space-md text-white shadow-card">
              <span className="text-label-caps font-bold uppercase text-chip">Compensación al viajero</span>
              <span className="text-headline-lg font-extrabold">{formatearValor(e.valor, e.moneda)}</span>
            </section>

            <section className="flex flex-col gap-3 rounded-card bg-card p-space-md shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="text-title-md text-on-surface">Observaciones de la encomienda</h2>
                <Icon name="inventory_2" className="text-[20px] text-wine" />
              </div>
              <p className="rounded-control bg-field/60 p-3 text-body-md leading-relaxed text-on-surface">
                {e.observaciones || 'El remitente no dejó observaciones.'}
              </p>
              {e.fechaVencimiento && e.estado === 'disponible' && (
                <p className="flex items-center gap-1.5 text-label-md text-muted">
                  <Icon name="calendar_today" className="text-[16px]" />
                  Disponible hasta el {formatearFecha(e.fechaVencimiento)}
                </p>
              )}
            </section>

            {e.estado === 'disponible' && (
              <>
                <div className="flex items-start gap-2.5 px-2">
                  <Icon name="security" className="mt-0.5 text-[18px] text-navy-soft" />
                  <p className="text-body-sm text-on-surface-variant">
                    Como viajero tienes derecho a revisar el contenido del paquete en persona antes de aceptarlo.
                  </p>
                </div>

                {!activo && (
                  <Alert
                    tone="info"
                    action={
                      <Link to="/viajero/viaje/nuevo" className="font-semibold underline">
                        Registrar viaje
                      </Link>
                    }
                  >
                    Necesitas un viaje activo para tomar encomiendas.
                  </Alert>
                )}
                {takeError && <Alert>{takeError}</Alert>}

                <div className="flex flex-col gap-2">
                  <Button
                    trailingIcon="arrow_forward"
                    loading={taking}
                    loadingText="Asignando a tu vuelo…"
                    disabled={!activo}
                    onClick={() => void tomar()}
                  >
                    Tomar encomienda
                  </Button>
                  <p className="px-3 text-center text-body-sm text-on-surface-variant">
                    Al tomar la encomienda te comprometes a transportarla de forma segura.
                  </p>
                </div>
              </>
            )}

            {e.estado === 'tomada' && (
              <Alert tone="info">Ya tomaste esta encomienda. Coordina con el remitente dónde y cuándo entregarla.</Alert>
            )}
          </>
        )}
      </Screen>
    </>
  );
}
