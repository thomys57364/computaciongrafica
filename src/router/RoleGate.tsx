import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { roleStorage, type Rol } from '../utils/roleStorage';

/**
 * Guardia por rol de /remitente/* y /viajero/*. No bloquea: la cuenta es la misma para los dos roles, así que
 * abrir una ruta de un rol activa ese modo (y lo guarda). Así funciona el selector de modo del encabezado.
 */
export function RoleGate({ rol }: { rol: Rol }) {
  const { user } = useAuth();
  if (!user) return null;
  // Escritura idempotente en localStorage: no afecta al render.
  if (roleStorage.get(user.uid) !== rol) roleStorage.set(user.uid, rol);
  return <Outlet />;
}
