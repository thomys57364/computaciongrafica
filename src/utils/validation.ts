/** Validaciones de formularios. Cada función devuelve el mensaje de error o null si el valor es válido. */

export const MIN_PASSWORD = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function required(value: string, label = 'Este campo'): string | null {
  return value.trim() ? null : `${label} es obligatorio.`;
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Ingresa tu correo electrónico.';
  return EMAIL_RE.test(value.trim()) ? null : 'Ingresa un correo válido.';
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Ingresa una contraseña.';
  return value.length >= MIN_PASSWORD ? null : `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
}

export function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (!confirm) return 'Confirma tu contraseña.';
  return password === confirm ? null : 'Las contraseñas no coinciden.';
}

/** Teléfono: dígitos con +, espacios, guiones o paréntesis opcionales; entre 7 y 15 dígitos. */
export function validatePhone(value: string): string | null {
  if (!value.trim()) return 'El teléfono es obligatorio.';
  if (!/^\+?[\d\s()-]+$/.test(value.trim())) return 'El teléfono solo puede tener números, espacios y +.';
  const digits = value.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15 ? null : 'Ingresa un teléfono válido (7 a 15 dígitos).';
}

export interface ProfileFormValues {
  nombre: string;
  apellido: string;
  telefono: string;
  nacionalidad: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export function validateProfile(v: ProfileFormValues): FormErrors<ProfileFormValues> {
  return compact({
    nombre: required(v.nombre, 'El nombre'),
    apellido: required(v.apellido, 'El apellido'),
    telefono: validatePhone(v.telefono),
    nacionalidad: v.nacionalidad ? null : 'Selecciona tu nacionalidad.',
  });
}

export interface RegisterFormValues extends ProfileFormValues {
  email: string;
  password: string;
  confirm: string;
}

export function validateRegister(v: RegisterFormValues): FormErrors<RegisterFormValues> {
  return compact({
    ...validateProfile(v),
    email: validateEmail(v.email),
    password: validatePassword(v.password),
    confirm: validatePasswordConfirm(v.password, v.confirm),
  });
}

export interface LoginFormValues {
  email: string;
  password: string;
}

/** En el login no se exige el mínimo de 8: solo que haya contraseña (las cuentas antiguas podrían ser más cortas). */
export function validateLogin(v: LoginFormValues): FormErrors<LoginFormValues> {
  return compact({
    email: validateEmail(v.email),
    password: v.password ? null : 'Ingresa tu contraseña.',
  });
}

export interface ChangePasswordValues {
  current: string;
  password: string;
  confirm: string;
}

export function validateChangePassword(v: ChangePasswordValues): FormErrors<ChangePasswordValues> {
  const password =
    validatePassword(v.password) ??
    (v.current && v.password === v.current ? 'La nueva contraseña debe ser distinta de la actual.' : null);
  return compact({
    current: v.current ? null : 'Ingresa tu contraseña actual.',
    password,
    confirm: validatePasswordConfirm(v.password, v.confirm),
  });
}

export interface ChangeEmailValues {
  current: string;
  email: string;
}

export function validateChangeEmail(v: ChangeEmailValues, currentEmail: string | null): FormErrors<ChangeEmailValues> {
  const email =
    validateEmail(v.email) ??
    (currentEmail && v.email.trim().toLowerCase() === currentEmail.toLowerCase()
      ? 'Ese ya es tu correo actual.'
      : null);
  return compact({
    current: v.current ? null : 'Ingresa tu contraseña actual.',
    email,
  });
}

/* ---------- Viajes y encomiendas ---------- */

/** Aerolínea (2 caracteres) + número de 1 a 4 dígitos + sufijo opcional: "AV 010", "AA123", "LA2400". */
const FLIGHT_RE = /^[A-Z0-9]{2}\s?\d{1,4}[A-Z]?$/;

export function validateFlightNumber(value: string): string | null {
  const v = value.trim().toUpperCase();
  if (!v) return 'Ingresa el número de vuelo.';
  return FLIGHT_RE.test(v) ? null : 'Usa el formato de tu vuelo, por ejemplo AV 010.';
}

/**
 * Ciudad escrita en un campo con autocompletado. Si la lista del backend no cargó (`ciudades` vacía)
 * se acepta cualquier texto para no bloquear al usuario.
 */
export function validateCity(value: string, ciudades: string[], label: string): string | null {
  if (!value.trim()) return `Selecciona la ciudad de ${label}.`;
  if (ciudades.length === 0) return null;
  const ok = ciudades.some((c) => c.localeCompare(value.trim(), 'es', { sensitivity: 'base' }) === 0);
  return ok ? null : 'Elige una ciudad de la lista.';
}

/** `minDate`: primera fecha permitida (ver fechaMinimaViaje). */
export function validateTripDate(value: string, minDate: string): string | null {
  if (!value) return 'Selecciona la fecha del viaje.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) return 'La fecha no es válida.';
  return value < minDate ? `Elige una fecha desde el ${minDate.split('-').reverse().join('/')}.` : null;
}

export interface TripFormValues {
  numeroVuelo: string;
  ciudadOrigen: string;
  ciudadDestino: string;
  fechaViaje: string;
}

export function validateTrip(v: TripFormValues, ciudades: string[], minDate: string): FormErrors<TripFormValues> {
  const sameCity =
    v.ciudadOrigen.trim() &&
    v.ciudadDestino.trim() &&
    v.ciudadOrigen.trim().localeCompare(v.ciudadDestino.trim(), 'es', { sensitivity: 'base' }) === 0;
  return compact({
    numeroVuelo: validateFlightNumber(v.numeroVuelo),
    ciudadOrigen: validateCity(v.ciudadOrigen, ciudades, 'origen'),
    ciudadDestino: validateCity(v.ciudadDestino, ciudades, 'destino') ?? (sameCity ? 'El destino debe ser distinto del origen.' : null),
    fechaViaje: validateTripDate(v.fechaViaje, minDate),
  });
}

export const MAX_OBSERVACIONES = 300;
export const MONEDAS = ['USD', 'COP'] as const;

export interface ParcelFormValues {
  ciudadOrigen: string;
  ciudadDestino: string;
  observaciones: string;
  moneda: string;
  valor: string;
}

export function validateParcel(v: ParcelFormValues, ciudades: string[]): FormErrors<ParcelFormValues> {
  const sameCity =
    v.ciudadOrigen.trim() &&
    v.ciudadDestino.trim() &&
    v.ciudadOrigen.trim().localeCompare(v.ciudadDestino.trim(), 'es', { sensitivity: 'base' }) === 0;
  const valor = Number(v.valor.replace(',', '.'));
  let errValor: string | null = null;
  if (!v.valor.trim()) errValor = 'Ingresa el valor que ofreces.';
  else if (!Number.isFinite(valor) || valor <= 0) errValor = 'El valor debe ser mayor que cero.';
  return compact({
    ciudadOrigen: validateCity(v.ciudadOrigen, ciudades, 'origen'),
    ciudadDestino: validateCity(v.ciudadDestino, ciudades, 'destino') ?? (sameCity ? 'El destino debe ser distinto del origen.' : null),
    observaciones:
      v.observaciones.trim().length === 0
        ? 'Describe qué envías.'
        : v.observaciones.length > MAX_OBSERVACIONES
          ? `Máximo ${MAX_OBSERVACIONES} caracteres.`
          : null,
    moneda: (MONEDAS as readonly string[]).includes(v.moneda) ? null : 'Selecciona la moneda.',
    valor: errValor,
  });
}

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}

function compact<T>(obj: Record<string, string | null | undefined>): FormErrors<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, msg]) => !!msg)) as FormErrors<T>;
}
