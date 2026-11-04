import { NavLink } from 'react-router-dom';
import type { Rol } from '../utils/roleStorage';
import { Icon } from './Icon';

interface Item {
  to: string;
  icon: string;
  label: string;
}

const ITEMS: Record<Rol, Item[]> = {
  viajero: [
    { to: '/home/viajero', icon: 'home', label: 'Inicio' },
    { to: '/viajero/viajes', icon: 'luggage', label: 'Mis viajes' },
    { to: '/perfil/editar', icon: 'account_circle', label: 'Perfil' },
  ],
  remitente: [
    { to: '/home/remitente', icon: 'local_shipping', label: 'Inicio' },
    { to: '/perfil/editar', icon: 'account_circle', label: 'Perfil' },
  ],
};

/** Barra de navegación inferior de los Home (cambia según el rol). */
export function BottomNav({ rol }: { rol: Rol }) {
  return (
    <nav
      aria-label="Navegación principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 bg-surface/90 shadow-[0_-4px_20px_0_rgba(11,18,64,0.06)] backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-app items-center justify-around px-gutter-mobile">
        {ITEMS[rol].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex min-h-[44px] min-w-[64px] flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? 'font-semibold text-wine' : 'text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            <Icon name={item.icon} className="text-[24px]" />
            <span className="text-label-caps">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
