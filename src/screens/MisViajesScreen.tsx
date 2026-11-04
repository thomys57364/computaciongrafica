import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { viajesApi, type EstadoViaje, type Viaje } from '../api/viajesApi';
import { Alert } from '../components/Alert';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { EmptyState, LoadState } from '../components/LoadState';
import { RouteStrip } from '../components/RouteStrip';
import { Screen } from '../components/Screen';
import { StatusBadge, type BadgeTone } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useAsync } from '../hooks/useAsync';
import { errorMessage } from '../utils/errorMessage';
import { ETIQUETA_VIAJE, esViajeActivo, formatearFecha } from '../utils/envios';

const TONO: Record<EstadoViaje, BadgeTone> = {
  disponible: 'info',
  contactado: 'info',
  completado: 'done',
  cancelado: 'muted',
};

/** Lista de todos los viajes del usuario, con acciones sobre el viaje activo (completar / cancelar). */
export function MisViajesScreen() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => viajesApi.listar());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const viajes = useMemo(
    () => [...(data ?? [])].sort((a, b) => (b.fechaViaje ?? '').localeCompare(a.fechaViaje ?? '')),
    [data],
  );
  const hayActivo = viajes.some(esViajeActivo);

  const cambiarEstado = async (viaje: Viaje, estado: EstadoViaje, mensaje: string) => {
    setActionError(null);
    setNotice(null);
    setBusyId(viaje._id);
    try {
      await viajesApi.cambiarEstado(viaje._id, estado);
      setConfirmId(null);
      setNotice(mensaje);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <TopBar title="Mis viajes" backTo="/home/viajero" />
      <Screen withTopBar className="gap-space-md pb-24">
        <div className="pt-3" />
        {notice && (
          <Alert tone="success" onDismiss={() => setNotice(null)}>
            {notice}
          </Alert>
        )}
        {actionError && <Alert onDismiss={() => setActionError(null)}>{actionError}</Alert>}
        <LoadState loading={loading} error={error} onRetry={reload} />

        {!loading && !error && (
          <>
            {viajes.length === 0 ? (
              <EmptyState icon="luggage" title="Aún no has registrado viajes">
                Registra tu próximo vuelo para recibir encomiendas en tu ruta.
              </EmptyState>
            ) : (
              viajes.map((v) => (
                <article key={v._id} className="flex flex-col gap-space-sm rounded-card bg-card p-space-md shadow-card">
                  <div className="flex items-center justify-between gap-2 border-b border-field-focus pb-3">
                    <span className="flex min-w-0 items-center gap-2 text-label-md font-bold text-on-surface">
                      <Icon name="flight" className="text-[20px] text-air" />
                      <span className="truncate">{v.numeroVuelo}</span>
                    </span>
                    <StatusBadge tone={TONO[v.estado] ?? 'muted'}>{ETIQUETA_VIAJE[v.estado] ?? v.estado}</StatusBadge>
                  </div>
                  <RouteStrip origen={v.ciudadOrigen} destino={v.ciudadDestino} />
                  <span className="flex items-center gap-1 text-label-md text-on-surface-variant">
                    <Icon name="calendar_today" className="text-[16px]" />
                    {formatearFecha(v.fechaViaje)}
                  </span>

                  {esViajeActivo(v) &&
                    (confirmId === v._id ? (
                      <div className="flex flex-col gap-2 rounded-control bg-error-bg p-3">
                        <p className="text-body-sm font-medium text-wine">
                          ¿Cancelar este viaje? Dejarás de recibir encomiendas en esta ruta.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setConfirmId(null)}
                            disabled={busyId === v._id}
                            className="!min-h-11"
                          >
                            No, volver
                          </Button>
                          <Button
                            loading={busyId === v._id}
                            loadingText="Cancelando…"
                            onClick={() => void cambiarEstado(v, 'cancelado', 'Viaje cancelado.')}
                            className="!min-h-11"
                          >
                            Sí, cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setConfirmId(v._id)}
                          disabled={busyId !== null}
                          className="!min-h-11"
                        >
                          Cancelar viaje
                        </Button>
                        <Button
                          variant="secondary"
                          trailingIcon="check_circle"
                          loading={busyId === v._id}
                          loadingText="Guardando…"
                          disabled={busyId !== null}
                          onClick={() => void cambiarEstado(v, 'completado', 'Viaje marcado como completado.')}
                          className="!min-h-11"
                        >
                          Completado
                        </Button>
                      </div>
                    ))}
                </article>
              ))
            )}

            <div className="flex flex-col gap-2 pt-space-sm">
              <Button trailingIcon="add" onClick={() => navigate('/viajero/viaje/nuevo')} disabled={hayActivo}>
                Registrar nuevo viaje
              </Button>
              {hayActivo && (
                <p className="text-center text-body-sm text-on-surface-variant">
                  Solo puedes tener un viaje activo. Cancélalo o márcalo como completado para registrar otro.
                </p>
              )}
            </div>
          </>
        )}
      </Screen>
      <BottomNav rol="viajero" />
    </>
  );
}
