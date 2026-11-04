import { useNavigate } from 'react-router-dom';
import type { Rol } from '../utils/roleStorage';
import { initials } from './Avatar';
import { Icon } from './Icon';

const MODOS: { rol: Rol; icon: string; label: string }[] = [
  { rol: 'remitente', icon: 'inventory_2', label: 'Remitente' },
  { rol: 'viajero', icon: 'flight', label: 'Viajero' },
];

/**
 * Barra superior de los Home: logo, selector de modo (Remitente / Viajero) y acceso al perfil.
 * Cambiar de modo solo navega al otro Home: RoleGate guarda el rol nuevo.
 */
export function HomeHeader({ rol, nombre, apellido }: { rol: Rol; nombre?: string; apellido?: string }) {
  const navigate = useNavigate();
  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-40 bg-surface/80 shadow-bar backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-app items-center justify-between gap-2 px-margin-mobile">
        <div className="flex items-center gap-space-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-navy">
            <Icon name="flight_takeoff" filled className="text-[20px] text-white" />
          </span>
          <span className="hidden text-title-md font-bold tracking-tight text-on-surface min-[400px]:inline">Lapticon</span>
        </div>
        <div role="radiogroup" aria-label="Modo de uso" className="flex items-center gap-0.5 rounded-full bg-field p-1">
          {MODOS.map((m) => {
            const selected = m.rol === rol;
            return (
              <button
                key={m.rol}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => !selected && navigate(`/${m.rol}`, { replace: true })}
                className={`flex h-8 items-center gap-1 rounded-full px-2.5 text-label-md transition-all ${
                  selected ? 'bg-navy text-white shadow-card' : 'text-navy hover:bg-field-focus'
                }`}
              >
                <Icon name={m.icon} className="text-[16px]" />
                {m.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => navigate('/perfil')}
          aria-label="Mi perfil"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-label-md text-white"
        >
          {initials(nombre, apellido)}
        </button>
      </div>
    </header>
  );
}
