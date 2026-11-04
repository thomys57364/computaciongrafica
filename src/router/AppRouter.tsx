import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ChangeEmailScreen } from '../screens/ChangeEmailScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { CompleteProfileScreen } from '../screens/CompleteProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
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
import { RoleSelectionScreen } from '../screens/RoleSelectionScreen';
import { EntryRedirect, Gate } from './guards';

/**
 * Mapa de navegación:
 *   sin sesión       → /login ⇄ /registro, /recuperar → /recuperar/enviado
 *   sesión sin perfil → /completar-perfil
 *   sesión + perfil  → /rol → /home/remitente → /remitente/encomienda/nueva
 *                          → /remitente/viajeros
 *                          → /home/viajero   → /viajero/viajes, /viajero/viaje/nuevo, /viajero/encomienda/:id
 *                      /perfil/editar → /perfil/contrasena | /perfil/correo
 *   cualquiera       → /recuperar (con sesión se llega desde "¿La olvidaste?")
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
          <Route path="/rol" element={<RoleSelectionScreen />} />
          <Route path="/home/remitente" element={<HomeRemitenteScreen />} />
          <Route path="/remitente/encomienda/nueva" element={<NuevaEncomiendaScreen />} />
          <Route path="/remitente/viajeros" element={<ViajerosDisponiblesScreen />} />
          <Route path="/home/viajero" element={<HomeViajeroScreen />} />
          <Route path="/viajero/encomienda/:id" element={<EncomiendaViajeroScreen />} />
          <Route path="/viajero/viajes" element={<MisViajesScreen />} />
          <Route path="/viajero/viaje/nuevo" element={<RegistrarViajeScreen />} />
          <Route path="/perfil/editar" element={<EditProfileScreen />} />
          {/* Contraseña y correo redirigen a /perfil/editar si la cuenta no tiene proveedor password. */}
          <Route path="/perfil/contrasena" element={<ChangePasswordScreen />} />
          <Route path="/perfil/correo" element={<ChangeEmailScreen />} />
        </Route>

        <Route path="*" element={<EntryRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
