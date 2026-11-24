# Lapticon

Lapticon es una app web (PWA) que conecta a personas que quieren enviar una encomienda con viajeros que ya van en camino a ese destino. Este documento explica cómo está armado el proyecto: dónde vive cada cosa y para qué sirve. En total son unas 3.300 líneas dentro de `src/`.

## Criterios de entrega
* Video (5 minutos): completado
* Registro de usuarios: completado
* Registro de encomienda: completado
* Registro de viaje: completado
* UX/UI (se evalúa sobre las funcionalidades anteriores): Completo

## Observaciones sobre funcionalidades pendientes, si aplica:
No funciona eliminar Encomiendas por restricción del Back y tampoco deja tener interacciones entre rol de Encomiendas y Viajero

---

## Enlaces del proyecto

- [Video de presentación](https://youtu.be/acfuO6u_gLs)
- [Tablero en Jira](https://academia-team-r8egh69r.atlassian.net/jira/software/projects/SCRUM/boards/1/timeline?jql=assignee+%3D+empty&atlOrigin=eyJpIjoiYTA3YjZiNjMxOWNhNDNhYmJiY2U1YzdhYjQ3ZjE5MTUiLCJwIjoiaiJ9)
- [Diseño en Figma](https://www.figma.com/design/zyyvzUzdnDSOjtc7hZ6YjA/login?node-id=0-1&t=3AIC2fHPZ87WJuHU-1)

### Jira

![Jira 1](<photos/jira1.jpeg>)

![Jira 2](<photos/jira2.jpeg>)

### Figma

![Figma 1](<photos/figma1.jpeg>)

![Figma 2](<photos/figma2.jpeg>)

![Figma 3](<photos/figma3.jpeg>)

---

## 1. Cómo arranca la app

Al abrir la página pasa esto, en orden:

```
index.html  →  src/main.tsx  →  src/App.tsx  →  AuthProvider + AppRouter
```

| Archivo | Qué hace |
|---|---|
| `index.html` | Es la página base. Carga la fuente de íconos de Google (`icon_names=…`). Cuando se necesita un ícono nuevo, se agrega ahí, en orden alfabético. |
| `src/main.tsx` | Carga la fuente Inter y los estilos. Importa `App` de forma diferida: si falta el `.env`, la pantalla muestra "No se pudo iniciar Lapticon" en vez de quedarse en blanco. |
| `src/App.tsx` | Envuelve todo con `AuthProvider` (el estado de la sesión) y monta el router junto con el aviso de "servidor despertando". |
| `src/index.css` | Las directivas de Tailwind y unos pocos estilos globales. |

---

## 2. Configuración (raíz del proyecto)

| Archivo | Para qué sirve |
|---|---|
| `package.json` | Dependencias y scripts: `dev`, `build`, `preview` y `test`. |
| `.env.example` | Lista los nombres de las 6 variables `VITE_FIREBASE_*`. El `.env` real lleva los valores y no se sube a GitHub. |
| `.gitignore` | Deja por fuera `.env`, `node_modules`, `dist`, `design/` y `docs/`. |
| `vite.config.ts` | Configura el plugin de React, la PWA (manifest y service worker con Workbox) y el proxy `/api` hacia Render para desarrollo. |
| `tailwind.config.ts` | Toma colores, tamaños y radios de `src/theme/tokens.ts`. |
| `postcss.config.js` | Lo necesita Tailwind para funcionar. |
| `tsconfig.json` | Configuración de TypeScript. |
| `vercel.json` | Para producción en Vercel: manda `/api/*` a Render y todo lo demás a `index.html`. |
| `netlify.toml` y `public/_redirects` | Hacen lo mismo, pero para Netlify. |
| `public/icon.svg` y los PNG | Íconos de la PWA. |

**¿Por qué hay un proxy?** El backend en Render solo acepta peticiones (CORS) desde ciertos dominios, y `localhost` no es uno de ellos. Por eso la app nunca le habla directo a Render: le pide `/api/...` a su propio dominio y alguien en el medio reenvía la petición. En desarrollo lo hace Vite; en producción, Vercel o Netlify.

---

## 3. `src/` carpeta por carpeta

### `theme/tokens.ts`: el diseño

Aquí están la paleta (navy `#0B1240`, vino `#A50012`, azul `air`, fondos, bordes, verde de éxito…), los tamaños de letra, los radios (12 px en los controles y 16 px en las tarjetas), los espaciados y las sombras. Todo viene del diseño hecho en Figma. Si hay que cambiar un color en toda la app, se cambia en este archivo y listo.

### `config/firebase.ts`: conexión con Firebase

- Lee las variables `VITE_FIREBASE_*` del `.env` y lanza un error claro si falta alguna.
- Crea `auth`, configurado para que los correos de Firebase lleguen en español.

### `api/`: comunicación con el backend

| Archivo | Qué hace |
|---|---|
| `apiClient.ts` | Es el corazón de las llamadas HTTP. El detalle está más abajo. |
| `usersApi.ts` | Tiene `register` (POST `/api/users/register`), `get` (GET `/api/users/:uid`) y `update` (PUT). También incluye `lookupProfile()`, que decide si el usuario ya tiene perfil ("complete") o le falta ("missing"). |
| `viajesApi.ts` | `crear`, `listar` y `cambiarEstado` sobre `/api/viajes`. |
| `encomiendasApi.ts` | `crear`, `listar`, `disponiblesEnRuta` y `cambiarEstado` sobre `/api/encomiendas`. |
| `ciudadesApi.ts` | GET `/api/ciudades/ciudades` (pública y con caché) para el autocompletado de ciudades. |
| `paisesApi.ts` | GET `/api/ciudades/paises`. Guarda la lista en memoria para no pedirla dos veces. |
| `ratingsApi.ts` | GET `/api/ratings/:uid` (pública): total y promedio de calificaciones de un usuario. |
| `respuestas.ts` | `asList` lee la lista de una respuesta, ya venga como arreglo o envuelta (`{ viajes: [...] }`). La usan `viajesApi` y `encomiendasApi`. |
| `serverWake.ts` | Detecta cuando una petición pasa de 4 s. Con eso se muestra el aviso "El servidor está despertando" (Render gratis puede tardar entre 30 y 60 s). |

Esto es lo que hace `apiClient.ts` en cada petición:

- Agrega `Authorization: Bearer <token>` con `getIdToken()`.
- Corta la petición a los 60 s.
- Convierte los errores en `ApiError`, con mensajes en español para 401, 403, 400, falta de red y timeout.
- Solo en los GET, reintenta una vez ante 502/503/504 o un corte de red (que normalmente es Render despertando). Los POST, PUT y PATCH no se repiten, para no duplicar datos.
- En un 400 o 409 muestra el texto que manda el backend (`{ error }`), si lo hay.
- Ante un 401, reintenta una vez con un token renovado.

### `auth/`: sesión del usuario

| Archivo | Qué hace |
|---|---|
| `authService.ts` | Funciones sueltas que hablan con Firebase: login, registro, Google (con popup, o con redirección si el navegador bloquea el popup), recuperar contraseña y cerrar sesión. También `changePassword` (confirma la contraseña actual y luego cambia), `requestEmailChange` (manda un enlace de verificación al correo nuevo) y `hasPasswordProvider` (dice si la cuenta tiene contraseña o solo Google). |
| `AuthContext.tsx` | El estado global de la sesión. El detalle está más abajo. |
| `firebaseErrors.ts` | Traduce los códigos de Firebase (`auth/wrong-password`, `auth/too-many-requests`…) a mensajes en español. |

`AuthContext.tsx` escucha a Firebase con `onAuthStateChanged` y maneja un `status` que puede valer:

```
loading          → todavía no se sabe si hay sesión
signedOut        → no hay sesión
registering      → acaba de crear la cuenta y está guardando el perfil
checkingProfile  → consultando al backend si tiene perfil
needsProfile     → tiene cuenta pero no perfil (por ejemplo, entró con Google por primera vez)
profileError     → falló la consulta del perfil (sin red, servidor caído)
ready            → sesión y perfil listos
```

Además les entrega a las pantallas `user`, `profile`, `completeProfile`, `updateProfile`, `logout` y `registerWithEmail`, entre otras cosas.

### `router/`: navegación

- `AppRouter.tsx` es la lista de rutas.
- `guards.tsx` tiene las guardias:
  - `Gate` deja entrar a una ruta solo si el `status` lo permite. Si no, muestra una pantalla de carga o de error, o redirige a donde corresponda.
  - `EntryRedirect` atiende `/` y las rutas desconocidas: te manda a `/login`, `/completar-perfil` o a tu home, según la sesión. Entra al Home del último modo usado (remitente la primera vez).
  - `RoleGate` protege `/remitente/*` y `/viajero/*`. No bloquea a nadie: abrir una ruta de un rol activa ese modo, y así funciona el selector del encabezado. No existe una pantalla para escoger rol. El rol se guarda en `localStorage` por usuario (el backend no lo guarda) y se conserva al cerrar sesión.

```
Sin sesión          → /login ⇄ /registro       /recuperar → /recuperar/enviado
Cuenta sin perfil   → /completar-perfil
Sesión completa     → Home del último modo (remitente la primera vez)
  /remitente        → encomiendas/nueva · encomiendas/:id · encomiendas/:id/editar · viajeros
  /viajero          → viajes · viajes/nuevo · encomiendas/:id
  /perfil           → /perfil/contrasena | /perfil/correo   (común a los dos roles)
El modo se cambia con el selector «Remitente | Viajero» del encabezado de los Home.
```

### `screens/`: las pantallas (una por archivo)

| Pantalla | Ruta | Qué hace |
|---|---|---|
| `LoginScreen` | `/login` | Inicio de sesión con correo y contraseña. El botón de Google está oculto mientras siga fallando (con `VITE_ENABLE_GOOGLE_SIGNIN=true` se muestra). |
| `RegisterScreen` | `/registro` | Crea la cuenta en Firebase y después el perfil en el backend. Si el backend falla, deja reintentar sin crear otra cuenta. |
| `CompleteProfileScreen` | `/completar-perfil` | Formulario de nombre, apellido, teléfono y nacionalidad para quien todavía no tiene perfil. |
| `ForgotPasswordScreen` | `/recuperar` | Pide el correo y envía el enlace. No revela si el correo existe o no. |
| `ResetSentScreen` | `/recuperar/enviado` | "Revisa tu correo", con un botón para reenviar que espera 30 s entre intentos. |
| `HomeViajeroScreen` | `/viajero` | Muestra el viaje activo (`GET /api/viajes/disponible`), las encomiendas disponibles en su ruta y sus últimos viajes (diseño «Home del Viajero» en Figma). |
| `RegistrarViajeScreen` | `/viajero/viajes/nuevo` | Formulario de viaje: número de vuelo, origen, destino y fecha. Hace `POST /api/viajes`. El backend solo admite un viaje activo, y su error 400 se muestra con un mensaje claro. |
| `MisViajesScreen` | `/viajero/viajes` | Todos los viajes con su estado. Permite marcar el activo como completado o cancelarlo (`PATCH /api/viajes/:id/estado`). |
| `HomeRemitenteScreen` | `/remitente` | Las encomiendas del remitente en pestañas (Disponibles, Tomadas, Vencidas, Recibidas), con «Editar», «Eliminar», «Marcar recibida» y «Republicar». «Eliminar» pasa la encomienda a `cancelada` (`PUT /api/encomiendas/:id/estado`, porque el backend no tiene DELETE) y deja de mostrarse. |
| `EncomiendaViajeroScreen` | `/viajero/encomiendas/:id` | Detalle de una encomienda para el viajero: quién la publicó (el nombre llega del backend como `remitenteNombre`, junto con su calificación) y el botón «Tomar encomienda» (`PUT /api/encomiendas/tomar/:id`). Al recargar, la busca de nuevo en la ruta del viaje activo (`/buscar` + `/disponibles`); si ya no está, vuelve al Home con un aviso. |
| `EncomiendaRemitenteScreen` | `/remitente/encomiendas/:id` | Detalle para el remitente (diseños «Tomada» y «Entregada»): viajero asignado con su calificación, valor y acciones (editar, marcar recibida, republicar). Al recargar la busca en `GET /api/encomiendas`. |
| `ViajerosDisponiblesScreen` | `/remitente/viajeros` | Viajes activos de otros usuarios en una ruta (`GET /api/viajes/disponibles`), con atajos a las rutas de tus propias encomiendas. |
| `NuevaEncomiendaScreen` | `/remitente/encomiendas/nueva` y `/remitente/encomiendas/:id/editar` | Formulario de encomienda: ruta, observaciones, moneda (USD o COP) y valor. Hace `POST /api/encomiendas`. |
| `EditProfileScreen` | `/perfil` | «Mi perfil»: los datos (el PUT solo lleva los campos que cambiaron), los enlaces a seguridad y cerrar sesión. |
| `ChangePasswordScreen` | `/perfil/contrasena` | Pide la contraseña actual, la nueva y su confirmación. |
| `ChangeEmailScreen` | `/perfil/correo` | Pide la contraseña actual y el correo nuevo, y envía un enlace de verificación. |
| `ProfileErrorScreen` | (sin ruta) | Aparece cuando no se pudo cargar el perfil y ofrece "Reintentar". |

### `components/`: piezas de interfaz reutilizables

- **Formularios:**
  - `TextField`, `PasswordField` (con el ojito para mostrar u ocultar) y `SelectField`.
  - `ProfileFields`, los campos del perfil que comparten Registro, Completar perfil y Editar perfil.
  - `ReadOnlyField`.
- **Botones y estados:**
  - `Button`, en variantes primario, secundario, Google y outline, con su estado de carga.
  - `Spinner` y `FullScreenLoader`.
  - `Alert`, con tonos de error, información y éxito.
  - `ServerWakeBanner`.
- **Estructura:**
  - `Screen` (el contenedor de cada pantalla) y `TopBar` (la barra superior con flecha para volver).
  - `Divider` y `Chip`.
- **Viajes y encomiendas:**
  - `CityField` (autocompletado con `<datalist>`), `TextAreaField` y `SegmentedControl`.
  - `SectionCard`, `RouteStrip`, `StatusBadge` y `LoadState`/`EmptyState`.
  - `HomeHeader` y `BottomNav` (la barra inferior, que cambia según el rol).
  - `PersonaCard`: la otra persona de la encomienda (el remitente para el viajero, el viajero para el remitente), con su calificación.
- **Gráficos:**
  - `Logo` es provisional, hay que reemplazarlo por el logo real.
  - `GoogleIcon`, `Icon` (los íconos de Material), `Avatar` (las iniciales del usuario) y `EmailIllustration`.

### `hooks/`: lógica reutilizable

- `useForm` maneja los valores del formulario, los errores por campo y la validación.
- `usePaises` carga la lista de países, con sus estados de carga y error.
- `useAsync` carga datos al abrir la pantalla y ofrece `reload`. `useCiudades` carga las ciudades y `useFlash` lee el mensaje de éxito que dejó la pantalla anterior.
- `useCooldown` lleva la cuenta regresiva de "Reenviar en 30 s".
- `useCalificacion` trae la calificación de un usuario. Si falla, la tarjeta simplemente omite esa línea.

### `utils/`: funciones de apoyo

| Archivo | Qué hace |
|---|---|
| `validation.ts` | Las reglas de cada formulario: correo válido, contraseña de 8 caracteres o más, que la confirmación coincida, teléfono, etc. |
| `paises.ts` | Ordena la lista de países poniendo a Colombia primero. |
| `profileDiff.ts` | Compara el perfil original con el editado para enviar solo lo que cambió. |
| `roleStorage.ts` | Guarda en el navegador el rol elegido por cada usuario (`lapticon:rol:<uid>`). |
| `envios.ts` | Fechas en UTC, valores, búsqueda de ciudades sin tildes, viaje activo, agrupación de encomiendas por estado y `unirEncomiendas` (junta `/buscar` y `/disponibles` sin perder el `uid` del remitente). |
| `calificaciones.ts` | Lee la respuesta de `/api/ratings/:uid` y arma el texto «4,7 · 3 calificaciones». |
| `errorMessage.ts` | Convierte cualquier error en un mensaje amigable en español. |
| `*.test.ts` | Las pruebas, que se corren con `npm test` (necesitan el `.env`). |

---

## 4. Ejemplo completo: registro con correo

1. `RegisterScreen` valida el formulario con `utils/validation.ts`.
2. Llama a `registerWithEmail` del `AuthContext`, que pone el estado en `registering`.
3. `authService` crea la cuenta en Firebase.
4. `usersApi.register` envía el POST a `/api/users/register`. `apiClient` le agrega el token y lo manda a `/api`, y el proxy lo reenvía a Render.
5. Si Render tarda más de 4 s, `serverWake` activa el `ServerWakeBanner`.
6. Cuando todo sale bien, el estado pasa a `ready` y la guardia te lleva a tu Home (remitente la primera vez).
