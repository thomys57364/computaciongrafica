import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { ChangeEmailScreen } from '../screens/ChangeEmailScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { CompleteProfileScreen } from '../screens/CompleteProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { EncomiendaRemitenteScreen } from '../screens/EncomiendaRemitenteScreen';
import { EncomiendaViajeroScreen } from '../screens/EncomiendaViajeroScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { HomeRemitenteScreen } from '../screens/HomeRemitenteScreen';
import { HomeViajeroScreen } from '../screens/HomeViajeroScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MisViajesScreen } from '../screens/MisViajesScreen';
import { NuevaEncomiendaScreen } from '../screens/NuevaEncomiendaScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { RegistrarViajeScreen } from '../screens/RegistrarViajeScreen';
import { ViajerosDisponiblesScreen } from '../screens/ViajerosDisponiblesScreen';
import { ResetSentScreen } from '../screens/ResetSentScreen';
import { EntryRedirect, Gate } from './guards';
import { RoleGate } from './RoleGate';

/**
 * Mapa de navegación:
 *   sin sesión        → /login ⇄ /registro, /recuperar → /recuperar/enviado
 *   sesión sin perfil → /completar-perfil
 *   sesión + perfil   → Home del rol guardado (el primer ingreso entra como remitente)
 *     /remitente      → encomiendas/nueva, encomiendas/:id, encomiendas/:id/editar, viajeros
 *     /viajero        → viajes, viajes/nuevo, encomiendas/:id
 *     /perfil         → /perfil/contrasena | /perfil/correo  (común a los dos roles)
 *   El modo (remitente/viajero) se cambia desde el Home o el perfil; RoleGate lo ajusta según la URL.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login: solo sin sesión (con sesión, la guardia lo salta). */}
        <Route element={<Gate allow={['signedOut']} />}>
          <Route path="/login" element={<LoginScreen />} />
        </Route>
        {/* Recuperar contraseña no depende de la sesión: sirve desde el login y desde Cambiar contraseña. */}
        <Route path="/recuperar" element={<ForgotPasswordScreen />} />
        <Route path="/recuperar/enviado" element={<ResetSentScreen />} />
        {/* El registro sigue visible si se creó la cuenta pero falló guardar el perfil (para reintentar). */}
        <Route element={<Gate allow={['signedOut', 'registering']} />}>
          <Route path="/registro" element={<RegisterScreen />} />
        </Route>

        <Route element={<Gate allow={['needsProfile', 'registering']} />}>
          <Route path="/completar-perfil" element={<CompleteProfileScreen />} />
        </Route>

        <Route element={<Gate allow={['ready']} />}>
          <Route path="/remitente" element={<RoleGate rol="remitente" />}>
            <Route index element={<HomeRemitenteScreen />} />
            <Route path="encomiendas/nueva" element={<NuevaEncomiendaScreen />} />
            <Route path="encomiendas/:id" element={<EncomiendaRemitenteScreen />} />
            <Route path="encomiendas/:id/editar" element={<NuevaEncomiendaScreen />} />
            <Route path="viajeros" element={<ViajerosDisponiblesScreen />} />
          </Route>

          <Route path="/viajero" element={<RoleGate rol="viajero" />}>
            <Route index element={<HomeViajeroScreen />} />
            <Route path="viajes" element={<MisViajesScreen />} />
            <Route path="viajes/nuevo" element={<RegistrarViajeScreen />} />
            <Route path="encomiendas/:id" element={<EncomiendaViajeroScreen />} />
          </Route>

          <Route path="/perfil" element={<EditProfileScreen />} />
          {/* Contraseña y correo redirigen a /perfil si la cuenta no tiene proveedor password. */}
          <Route path="/perfil/contrasena" element={<ChangePasswordScreen />} />
          <Route path="/perfil/correo" element={<ChangeEmailScreen />} />

          {/* Rutas antiguas: siguen funcionando por si hay enlaces guardados. */}
          <Route path="/home/:rol" element={<LegacyHome />} />
          <Route path="/rol" element={<Navigate to="/" replace />} />
          <Route path="/perfil/editar" element={<Navigate to="/perfil" replace />} />
          <Route path="/remitente/encomienda/nueva" element={<Navigate to="/remitente/encomiendas/nueva" replace />} />
          <Route path="/viajero/viaje/nuevo" element={<Navigate to="/viajero/viajes/nuevo" replace />} />
          <Route path="/viajero/encomienda/:id" element={<LegacyEncomiendaViajero />} />
        </Route>

        <Route path="*" element={<EntryRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

function LegacyHome() {
  const { rol } = useParams();
  return <Navigate to={rol === 'viajero' || rol === 'remitente' ? `/${rol}` : '/'} replace />;
}

function LegacyEncomiendaViajero() {
  const { id = '' } = useParams();
  return <Navigate to={`/viajero/encomiendas/${encodeURIComponent(id)}`} replace />;
}
