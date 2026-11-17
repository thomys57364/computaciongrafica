import { useNavigate } from 'react-router-dom';
import { encomiendasApi, type Encomienda } from '../api/encomiendasApi';
import { viajesApi, type Viaje } from '../api/viajesApi';
import { useAuth } from '../auth/AuthContext';
import { Alert } from '../components/Alert';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { HomeHeader } from '../components/HomeHeader';
import { Icon } from '../components/Icon';
import { EmptyState, LoadState } from '../components/LoadState';
import { RouteStrip } from '../components/RouteStrip';
import { StatusBadge } from '../components/StatusBadge';
import { TomadasDelViaje } from '../components/TomadasDelViaje';
import { useAsync } from '../hooks/useAsync';
import { useFlash } from '../hooks/useFlash';
import { ETIQUETA_VIAJE, formatearFecha, formatearValor, viajeActivo } from '../utils/envios';

/** Cuántos viajes anteriores se muestran en el Home (el resto, en «Mis viajes»). */
const VIAJES_EN_HOME = 3;

/** Diseño Stitch «Home del Viajero»: viaje activo + encomiendas disponibles en su ruta. */
export function HomeViajeroScreen() {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();
  const { flash, tone, dismiss } = useFlash();
  const nombre = (typeof profile?.nombre === 'string' && profile.nombre) || user?.displayName?.split(' ')[0] || '';
  const apellido = typeof profile?.apellido === 'string' ? profile.apellido : '';

  const { data, loading, error, reload } = useAsync(async () => {
    // GET /api/viajes/disponible da el viaje activo; la lista completa cubre los viajes «contactado»
    // (también activos) y alimenta «Mis viajes» en el Home.
    const [disponible, viajes] = await Promise.all([viajesApi.activo().catch(() => null), viajesApi.listar()]);
    const activo = disponible ?? viajeActivo(viajes);
    const { disponibles, tomadas } = activo
      ? await encomiendasApi.enRuta(activo.ciudadOrigen, activo.ciudadDestino)
      : { disponibles: [], tomadas: [] };
    const anteriores = viajes
      .filter((v) => v._id !== activo?._id)
      .sort((a, b) => (b.fechaViaje ?? '').localeCompare(a.fechaViaje ?? ''));
    return { activo, encomiendas: disponibles, tomadas, anteriores };
  });
  const activo = data?.activo ?? null;
  const encomiendas = data?.encomiendas ?? [];
  const tomadas = data?.tomadas ?? [];
  const anteriores = data?.anteriores ?? [];

  const verDetalle = (e: Encomienda) => navigate(`/viajero/encomiendas/${e._id}`, { state: { encomienda: e } });

  return (
    <>
      <HomeHeader rol="viajero" nombre={nombre} apellido={apellido} />
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col gap-space-md px-margin-mobile pb-24 pt-[calc(4.5rem+env(safe-area-inset-top,0px))]">
        <section>
          <h1 className="text-headline-md text-on-surface">Hola{nombre ? `, ${nombre}` : ''} 👋</h1>
          <p className="text-body-md text-on-surface-variant">
            Revisa tus viajes y las encomiendas disponibles para tu trayecto.
          </p>
        </section>

        {flash && (
          <Alert tone={tone} onDismiss={dismiss}>
            {flash}
          </Alert>
        )}

        <LoadState loading={loading} error={error} onRetry={reload} />

        {!loading && !error && (
          <>
            <section className="flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="text-label-caps font-bold uppercase text-on-surface-variant">Mi viaje activo</span>
                {activo && (
                  <span className="flex items-center gap-1.5 rounded-full bg-field-focus px-2.5 py-0.5 text-label-md text-wine">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-wine" />
                    Activo
                  </span>
                )}
              </div>

              {activo ? (
                <div className="flex flex-col gap-space-sm rounded-card bg-card p-space-md shadow-card">
                  <div className="flex items-center justify-between border-b border-field-focus pb-3">
                    <span className="flex items-center gap-2 text-label-md font-bold text-on-surface">
                      <Icon name="flight" className="text-[20px] text-air" />
                      {activo.numeroVuelo}
                    </span>
                    <span className="flex items-center gap-1 text-label-md text-on-surface-variant">
                      <Icon name="calendar_today" className="text-[16px]" />
                      {formatearFecha(activo.fechaViaje)}
                    </span>
                  </div>
                  <RouteStrip origen={activo.ciudadOrigen} destino={activo.ciudadDestino} />
                  <TomadasDelViaje tomadas={tomadas} onOpen={verDetalle} />
                  <Button variant="outline" trailingIcon="edit_calendar" onClick={() => navigate('/viajero/viajes')}>
                    Cambiar viaje o registrar nuevo
                  </Button>
                </div>
              ) : (
                <EmptyState icon="luggage" title="Aún no tienes un viaje activo">
                  Registra tu próximo vuelo para empezar a recibir encomiendas en tu ruta.
                </EmptyState>
              )}
            </section>

            {!activo && (
              <Button trailingIcon="arrow_forward" onClick={() => navigate('/viajero/viajes/nuevo')}>
                Registrar viaje
              </Button>
            )}

            {activo && (
              <section className="flex flex-col gap-space-sm pt-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-title-md font-bold text-on-surface">Encomiendas en tu ruta</h2>
                  <span className="rounded-full bg-chip px-2 py-0.5 text-label-caps font-semibold text-air">
                    {encomiendas.length} {encomiendas.length === 1 ? 'disponible' : 'disponibles'}
                  </span>
                </div>
                {encomiendas.length === 0 ? (
                  <EmptyState icon="inventory_2" title="Sin encomiendas por ahora">
                    Cuando un remitente publique un envío en tu ruta, lo verás aquí.
                  </EmptyState>
                ) : (
                  encomiendas.map((e) => <EncomiendaCard key={e._id} e={e} onOpen={() => verDetalle(e)} propia={e.uid === user?.uid} />)
                )}
              </section>
            )}

            {anteriores.length > 0 && (
              <section className="flex flex-col gap-space-sm pt-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-title-md font-bold text-on-surface">Mis viajes</h2>
                  <button
                    type="button"
                    onClick={() => navigate('/viajero/viajes')}
                    className="flex items-center gap-0.5 text-label-md font-semibold text-air hover:underline"
                  >
                    Ver todos
                    <Icon name="chevron_right" className="text-[18px]" />
                  </button>
                </div>
                {anteriores.slice(0, VIAJES_EN_HOME).map((v) => (
                  <ViajeResumen key={v._id} v={v} />
                ))}
              </section>
            )}
          </>
        )}

        <div className="mt-auto flex items-center justify-center gap-4 pt-space-lg text-body-sm text-muted">
          <button type="button" onClick={() => void logout()} className="underline-offset-2 hover:underline">
            Cerrar sesión
          </button>
        </div>
        <div aria-hidden="true" className="pb-safe" />
      </main>
      <BottomNav rol="viajero" />
    </>
  );
}

function EncomiendaCard({ e, onOpen, propia }: { e: Encomienda; onOpen: () => void; propia: boolean }) {
  return (
    <article className="flex flex-col gap-2.5 rounded-card bg-card p-space-md shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-1.5 text-label-md font-bold text-air">
            <Icon name="near_me" className="text-[16px]" />
            <span className="truncate">
              {e.ciudadOrigen} → {e.ciudadDestino}
            </span>
          </span>
          {propia && <span className="w-fit rounded-full bg-chip px-2 py-0.5 text-label-caps uppercase text-navy">Tu encomienda</span>}
          <p className="text-body-md leading-snug text-on-surface">{e.observaciones || 'Sin observaciones'}</p>
          {!propia && e.remitenteNombre?.trim() && (
            <span className="flex items-center gap-1 text-label-md text-on-surface-variant">
              <Icon name="person" className="text-[16px] text-navy-soft" />
              <span className="truncate">Publicada por {e.remitenteNombre.trim()}</span>
            </span>
          )}
        </div>
        <span className="shrink-0 text-headline-sm font-bold text-wine">{formatearValor(e.valor, e.moneda)}</span>
      </div>
      <Button variant="secondary" trailingIcon="chevron_right" onClick={onOpen} className="!min-h-10 text-label-md">
        {e.estado === 'tomada' ? 'Ver encomienda' : 'Ver detalle'}
      </Button>
    </article>
  );
}

function ViajeResumen({ v }: { v: Viaje }) {
  return (
    <article className="flex items-center justify-between gap-3 rounded-card bg-card p-space-md shadow-card">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-label-lg text-on-surface">
          {v.ciudadOrigen} → {v.ciudadDestino}
        </span>
        <span className="flex items-center gap-1 text-label-md text-on-surface-variant">
          <Icon name="flight" className="text-[14px] text-air" />
          {v.numeroVuelo} · {formatearFecha(v.fechaViaje)}
        </span>
      </div>
      <StatusBadge tone={v.estado === 'completado' ? 'done' : 'muted'}>{ETIQUETA_VIAJE[v.estado] ?? v.estado}</StatusBadge>
    </article>
  );
}
