import { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { encomiendasApi, type Encomienda, type EstadoEncomienda } from '../api/encomiendasApi';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { ConfirmInline } from '../components/ConfirmInline';
import { Icon } from '../components/Icon';
import { LoadState } from '../components/LoadState';
import { PersonaCard } from '../components/PersonaCard';
import { RouteStrip } from '../components/RouteStrip';
import { Screen } from '../components/Screen';
import { StatusBadge, type BadgeTone } from '../components/StatusBadge';
import { TopBar } from '../components/TopBar';
import { useAsync } from '../hooks/useAsync';
import { useViajerosDeTomadas } from '../hooks/useViajerosDeTomadas';
import { errorMessage } from '../utils/errorMessage';
import { ETIQUETA_ENCOMIENDA, formatearFecha, formatearValor, idCorto } from '../utils/envios';
import type { PrefillEncomienda } from './NuevaEncomiendaScreen';

const TONO: Record<EstadoEncomienda, BadgeTone> = {
  disponible: 'info',
  tomada: 'info',
  vencida: 'muted',
  recibida: 'done',
};

/**
 * Diseños Stitch «Detalle de Encomienda Tomada» y «Entregada» (vista remitente).
 * No existe GET /api/encomiendas/:id: se usa la encomienda que trae la lista y, al recargar la página,
 * se vuelve a buscar en GET /api/encomiendas. Si ya no está, se vuelve al Home con un aviso.
 */
export function EncomiendaRemitenteScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fromList = (useLocation().state as { encomienda?: Encomienda } | null)?.encomienda;

  const { data, loading, error, reload } = useAsync(async () => {
    const lista = await encomiendasApi.listar();
    // La lista es la fuente actual; la de la navegación solo sirve si el backend aún no la devuelve.
    return lista.find((e) => e._id === id) ?? (fromList && fromList._id === id ? fromList : null);
  });
  const e = data ?? null;
  const conViajero = useMemo(() => (e ? [e] : []), [e]);
  const viajero = useViajerosDeTomadas(conViajero)[e?.viajeroId ?? ''];

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const marcarRecibida = async () => {
    if (!e) return;
    setActionError(null);
    setSaving(true);
    try {
      await encomiendasApi.cambiarEstado(e._id, 'recibida');
      navigate('/remitente', { replace: true, state: { flash: 'Encomienda marcada como recibida.' } });
    } catch (err) {
      setActionError(errorMessage(err));
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!e) return;
    setActionError(null);
    setSaving(true);
    try {
      await encomiendasApi.eliminar(e._id);
      navigate('/remitente', { replace: true, state: { flash: 'Encomienda eliminada.' } });
    } catch (err) {
      setActionError(errorMessage(err));
      setSaving(false);
    }
  };

  const republicar = (x: Encomienda) => {
    const prefill: PrefillEncomienda = {
      ciudadOrigen: x.ciudadOrigen,
      ciudadDestino: x.ciudadDestino,
      observaciones: x.observaciones ?? '',
      moneda: x.moneda,
      valor: String(x.valor),
    };
    navigate('/remitente/encomiendas/nueva', { state: { prefill } });
  };

  return (
    <>
      <TopBar title="Detalle de encomienda" backTo="/remitente" />
      <Screen withTopBar className="gap-space-md pb-8">
        <div className="pt-3" />
        <LoadState loading={loading} error={error} onRetry={reload} />

        {!loading && !error && !e && (
          <Navigate
            to="/remitente"
            replace
            state={{ flash: 'No encontramos esa encomienda. Puede que ya no exista.', flashTone: 'info' }}
          />
        )}

        {!loading && !error && e && (
          <>
            <section className="flex items-center justify-between gap-2 rounded-card bg-card p-space-md shadow-card">
              <span className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-control bg-chip">
                  <Icon name="inventory_2" className="text-[20px] text-navy" />
                </span>
                <span className="flex flex-col">
                  <span className="text-label-caps uppercase text-on-surface-variant">Identificador</span>
                  <span className="text-label-lg text-on-surface">{idCorto(e._id)}</span>
                </span>
              </span>
              <StatusBadge tone={TONO[e.estado] ?? 'muted'} icon={e.estado === 'tomada' || e.estado === 'recibida' ? 'check_circle' : undefined}>
                {ETIQUETA_ENCOMIENDA[e.estado] ?? e.estado}
              </StatusBadge>
            </section>

            {e.estado === 'recibida' && (
              <Alert tone="success">Entrega finalizada. Tu encomienda llegó a su destino.</Alert>
            )}

            <section className="flex flex-col gap-3 rounded-card bg-card p-space-md shadow-card">
              <span className="flex items-center gap-1.5 text-label-caps font-bold uppercase text-on-surface-variant">
                <Icon name="flight_takeoff" className="text-[16px]" />
                Itinerario
              </span>
              <RouteStrip origen={e.ciudadOrigen} destino={e.ciudadDestino} />
            </section>

            {(e.estado === 'tomada' || e.estado === 'recibida') && (
              <PersonaCard
                etiqueta={e.estado === 'recibida' ? 'Viajero responsable' : 'Viajero asignado'}
                nombre={viajero?.nombreUsuario || 'Un viajero de Lapticon'}
                detalle={viajero ? `Viaja el ${formatearFecha(viajero.fechaViaje)}` : 'Tomó tu encomienda para su viaje'}
                uid={e.viajeroId}
              />
            )}

            <section className="flex flex-col gap-3 rounded-card bg-card p-space-md shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="text-title-md text-on-surface">Detalle del paquete</h2>
                <Icon name="description" className="text-[20px] text-wine" />
              </div>
              <p className="rounded-control bg-field/60 p-3 text-body-md leading-relaxed text-on-surface">
                {e.observaciones || 'Sin observaciones.'}
              </p>
              {e.fechaVencimiento && e.estado === 'disponible' && (
                <p className="flex items-center gap-1.5 text-label-md text-muted">
                  <Icon name="calendar_today" className="text-[16px]" />
                  Vence el {formatearFecha(e.fechaVencimiento)}
                </p>
              )}
            </section>

            <section className="flex flex-col gap-1 rounded-card bg-navy p-space-md text-white shadow-card">
              <span className="text-label-caps font-bold uppercase text-chip">Compensación al viajero</span>
              <span className="text-headline-lg font-extrabold">{formatearValor(e.valor, e.moneda)}</span>
            </section>

            {actionError && <Alert onDismiss={() => setActionError(null)}>{actionError}</Alert>}

            {e.estado === 'disponible' && (
              <Button
                variant="outline"
                trailingIcon="edit"
                onClick={() => navigate(`/remitente/encomiendas/${e._id}/editar`, { state: { editar: e } })}
              >
                Editar encomienda
              </Button>
            )}
            {e.estado === 'tomada' && (
              <div className="flex flex-col gap-2">
                <Button trailingIcon="task_alt" loading={saving} loadingText="Guardando…" onClick={() => void marcarRecibida()}>
                  Marcar como recibida
                </Button>
                <p className="px-3 text-center text-body-sm text-on-surface-variant">
                  Confírmalo solo cuando la encomienda haya llegado a su destino.
                </p>
              </div>
            )}
            {e.estado === 'vencida' && (
              <Button trailingIcon="refresh" onClick={() => republicar(e)}>
                Republicar encomienda
              </Button>
            )}
            {(e.estado === 'disponible' || e.estado === 'vencida') &&
              (confirmando ? (
                <ConfirmInline
                  message="¿Eliminar esta encomienda? Los viajeros dejarán de verla."
                  confirmLabel="Sí, eliminar"
                  loadingText="Eliminando…"
                  loading={saving}
                  onConfirm={() => void eliminar()}
                  onCancel={() => setConfirmando(false)}
                />
              ) : (
                <Button variant="outline" trailingIcon="delete" onClick={() => setConfirmando(true)}>
                  Eliminar encomienda
                </Button>
              ))}
          </>
        )}
      </Screen>
    </>
  );
}
