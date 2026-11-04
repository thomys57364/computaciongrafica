import { useNavigate } from 'react-router-dom';
import { initials } from './Avatar';
import { Icon } from './Icon';

/** Barra superior de los Home: logo + nombre y acceso al perfil con las iniciales del usuario. */
export function HomeHeader({ nombre, apellido }: { nombre?: string; apellido?: string }) {
  const navigate = useNavigate();
  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-40 bg-surface/80 shadow-bar backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-app items-center justify-between px-margin-mobile">
        <div className="flex items-center gap-space-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-control bg-navy">
            <Icon name="flight_takeoff" filled className="text-[20px] text-white" />
          </span>
          <span className="text-title-md font-bold tracking-tight text-on-surface">Lapticon</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/perfil/editar')}
          aria-label="Mi perfil"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-label-md text-white"
        >
          {initials(nombre, apellido)}
        </button>
      </div>
    </header>
  );
}
