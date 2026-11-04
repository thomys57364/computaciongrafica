import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { encomiendasApi, type Encomienda, type EstadoEncomienda } from '../api/encomiendasApi';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/Alert';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { ConfirmInline } from '../components/ConfirmInline';
import { HomeHeader } from '../components/HomeHeader';
import { Icon } from '../components/Icon';
import { EmptyState, LoadState } from '../components/LoadState';
import { StatusBadge, type BadgeTone } from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { useFlash } from '../hooks/useFlash';
import { useViajerosDeTomadas } from '../hooks/useViajerosDeTomadas';
import { errorMessage } from '../utils/errorMessage';
import { ETIQUETA_ENCOMIENDA, agruparEncomiendas, formatearFecha, formatearValor } from '../utils/envios';
import type { PrefillEncomienda } from './NuevaEncomiendaScreen';

const PESTAÑAS: { estado: EstadoEncomienda; label: string }[] = [
  { estado: 'disponible', label: 'Disponibles' },
  { estado: 'tomada', label: 'Tomadas' },
  { estado: 'vencida', label: 'Vencidas' },
  { estado: 'recibida', label: 'Recibidas' },
];

const VACIO: Record<EstadoEncomienda, string> = {
  disponible: 'No tienes encomiendas disponibles. Publica una para que los viajeros la vean.',
  tomada: 'Cuando un viajero tome una de tus encomiendas, aparecerá aquí.',
  vencida: 'No tienes encomiendas vencidas.',
  recibida: 'Aún no has recibido ninguna encomienda.',
};

const TONO: Record<EstadoEncomienda, BadgeTone> = {
  disponible: 'info',
  tomada: 'info',
  vencida: 'muted',
  recibida: 'done',
};

/** Diseño Stitch «Home del Remitente»: banner «Publicar» (única entrada a Nueva encomienda) y pestañas por estado. */
export function HomeRemitenteScreen() {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();
  const { flash, tone, dismiss } = useFlash();
  const nombre = (typeof profile?.nombre === 'string' && profile.nombre) || user?.displayName?.split(' ')[0] || '';
  const apellido = typeof profile?.apellido === 'string' ? profile.apellido : '';

  const { data, loading, error, reload } = useAsync(() => encomiendasApi.listar());
  const grupos = agruparEncomiendas(data ?? []);
  const viajeros = useViajerosDeTomadas(data ?? []);
  const [pestaña, setPestaña] = useState<EstadoEncomienda>('disponible');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const nueva = (prefill?: PrefillEncomienda) => navigate('/remitente/encomiendas/nueva', { state: { prefill } });

  const marcarRecibida = async (e: Encomienda) => {
    setActionError(null);
    setBusyId(e._id);
    try {
      await encomiendasApi.cambiarEstado(e._id, 'recibida');
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const eliminar = async (e: Encomienda) => {
    setActionError(null);
    setNotice(null);
    setBusyId(e._id);
    try {
      await encomiendasApi.eliminar(e._id);
      setConfirmId(null);
      setNotice('Encomienda eliminada.');
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const lista = grupos[pestaña];

  return (
    <>
      <HomeHeader rol="remitente" nombre={nombre} apellido={apellido} />
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col gap-space-md px-margin-mobile pb-24 pt-[calc(4.5rem+env(safe-area-inset-top,0px))]">
        <section className="flex flex-col gap-space-sm">
          <div>
            <h1 className="text-headline-md text-on-surface">Hola{nombre ? `, ${nombre}` : ''} 👋</h1>
            <p className="text-body-sm text-on-surface-variant">Gestiona y monitorea tus encomiendas activas</p>
          </div>
          <button
            type="button"
            onClick={() => nueva()}
            className="relative flex w-full items-center justify-between overflow-hidden rounded-card bg-navy p-4 text-left text-white shadow-raised"
          >
            <span className="z-10 flex flex-col gap-0.5">
              <span className="text-label-caps uppercase text-chip">Lapticon Express</span>
              <span className="text-title-md">Envía seguro con viajeros</span>
              <span className="text-body-sm text-chip">Publica tu encomienda y encuentra quién la lleve</span>
            </span>
            <span className="z-10 flex items-center gap-1 rounded-lg bg-wine px-3.5 py-2 text-label-md shadow-card">
              Publicar
              <Icon name="arrow_forward" className="text-[16px]" />
            </span>
          </button>
        </section>

        {flash && (
          <Alert tone={tone} onDismiss={dismiss}>
            {flash}
          </Alert>
        )}
        {notice && (
          <Alert tone="success" onDismiss={() => setNotice(null)}>
            {notice}
          </Alert>
        )}
        {actionError && <Alert onDismiss={() => setActionError(null)}>{actionError}</Alert>}

        <div role="tablist" aria-label="Estado de tus encomiendas" className="flex items-center gap-1 rounded-control bg-field p-1.5">
          {PESTAÑAS.map((p) => {
            const selected = pestaña === p.estado;
            return (
              <button
                key={p.estado}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setPestaña(p.estado)}
                className={`flex-1 rounded-lg px-1 py-2.5 text-center text-label-md transition-all ${
                  selected ? 'bg-navy text-white shadow-card' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {p.label}
                {data && ` (${grupos[p.estado].length})`}
              </button>
            );
          })}
        </div>

        <LoadState loading={loading} error={error} onRetry={reload} />

        {!loading && !error && (
          <div role="tabpanel" className="flex flex-col gap-space-md">
            {lista.length === 0 ? (
              <EmptyState icon="inventory_2" title="Nada por aquí">
                {VACIO[pestaña]}
              </EmptyState>
            ) : (
              lista.map((e) => (
                <article
                  key={e._id}
                  className={`flex flex-col gap-3 overflow-hidden rounded-card bg-card pt-4 shadow-card ${e.estado === 'vencida' ? 'opacity-90' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/remitente/encomiendas/${e._id}`, { state: { encomienda: e } })}
                    aria-label={`Ver detalle de ${e.ciudadOrigen} → ${e.ciudadDestino}`}
                    className="flex items-center justify-between gap-2 px-4 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chip">
                        <Icon name={e.estado === 'vencida' ? 'history' : 'flight_takeoff'} className="text-[18px] text-navy" />
                      </span>
                      <span className="truncate text-title-md text-on-surface">
                        {e.ciudadOrigen} → {e.ciudadDestino}
                      </span>
                    </div>
                    <StatusBadge tone={TONO[e.estado]} icon={e.estado === 'tomada' || e.estado === 'recibida' ? 'check_circle' : undefined}>
                      {ETIQUETA_ENCOMIENDA[e.estado]}
                    </StatusBadge>
                  </button>
                  <p className="px-4 text-body-sm text-on-surface-variant">{e.observaciones || 'Sin observaciones'}</p>
                  {(e.estado === 'tomada' || e.estado === 'recibida') && (
                    <p className="flex items-center gap-1.5 px-4 text-label-md text-on-surface">
                      <Icon name="flight" className="text-[16px] text-air" />
                      {e.viajeroId && viajeros[e.viajeroId]
                        ? `Lo lleva ${viajeros[e.viajeroId].nombreUsuario || 'un viajero'} · viaja el ${formatearFecha(viajeros[e.viajeroId].fechaViaje)}`
                        : 'Un viajero ya tomó tu encomienda'}
                    </p>
                  )}
                  {e.fechaVencimiento && e.estado === 'disponible' && (
                    <p className="flex items-center gap-1 px-4 text-label-md text-muted">
                      <Icon name="calendar_today" className="text-[14px]" />
                      Vence el {formatearFecha(e.fechaVencimiento)}
                    </p>
                  )}
                  {confirmId === e._id ? (
                    <div className="px-4 pb-4">
                      <ConfirmInline
                        message="¿Eliminar esta encomienda? Los viajeros dejarán de verla."
                        confirmLabel="Sí, eliminar"
                        loadingText="Eliminando…"
                        loading={busyId === e._id}
                        onConfirm={() => void eliminar(e)}
                        onCancel={() => setConfirmId(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 bg-field/50 px-4 py-3">
                      <span className="text-headline-sm font-bold text-wine">{formatearValor(e.valor, e.moneda)}</span>
                      {(e.estado === 'disponible' || e.estado === 'vencida') && (
                        <span className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            trailingIcon="delete"
                            onClick={() => setConfirmId(e._id)}
                            disabled={busyId !== null}
                            className="!min-h-10 !w-auto !px-3 text-label-md"
                          >
                            Eliminar
                          </Button>
                          {e.estado === 'disponible' ? (
                            <Button
                              variant="outline"
                              trailingIcon="edit"
                              onClick={() => navigate(`/remitente/encomiendas/${e._id}/editar`, { state: { editar: e } })}
                              className="!min-h-10 !w-auto !px-3 text-label-md"
                            >
                              Editar
                            </Button>
                          ) : (
                            <Button
                              trailingIcon="refresh"
                              onClick={() =>
                                nueva({
                                  ciudadOrigen: e.ciudadOrigen,
                                  ciudadDestino: e.ciudadDestino,
                                  observaciones: e.observaciones ?? '',
                                  moneda: e.moneda,
                                  valor: String(e.valor),
                                })
                              }
                              className="!min-h-10 !w-auto !px-3 text-label-md"
                            >
                              Republicar
                            </Button>
                          )}
                        </span>
                      )}
                      {e.estado === 'tomada' && (
                        <Button
                          variant="secondary"
                          trailingIcon="task_alt"
                          loading={busyId === e._id}
                          loadingText="Guardando…"
                          disabled={busyId !== null}
                          onClick={() => void marcarRecibida(e)}
                          className="!min-h-10 !w-auto !px-3 text-label-md"
                        >
                          Marcar recibida
                        </Button>
                      )}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-center gap-4 pt-space-lg text-body-sm text-muted">
          <button type="button" onClick={() => void logout()} className="underline-offset-2 hover:underline">
            Cerrar sesión
          </button>
        </div>
        <div aria-hidden="true" className="pb-safe" />
      </main>

      <BottomNav rol="remitente" />
    </>
  );
}
