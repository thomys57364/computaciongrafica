import { firebaseErrorMessage } from '../auth/firebaseErrors';

/** Código de error de Firebase (auth/...), si el error lo trae. */
export function errorCode(err: unknown): string | undefined {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : undefined;
}

/**
 * Texto que el backend manda en el cuerpo de un error HTTP ({ error }, { message } o { mensaje }), si lo hay.
 * Se lee por forma (sin importar apiClient) para no cargar Firebase desde aquí.
 */
export function backendMessage(err: unknown): string | null {
  if (!(err instanceof Error) || err.name !== 'ApiError') return null;
  const detail = (err as { detail?: unknown }).detail;
  if (!detail || typeof detail !== 'object') return null;
  const { error, message, mensaje } = detail as Record<string, unknown>;
  const text = [error, message, mensaje].find((m): m is string => typeof m === 'string' && m.trim() !== '');
  return text?.trim() ?? null;
}

/**
 * Mensaje amigable en español para cualquier error (Firebase, ApiError u otro).
 * `overrides` reemplaza mensajes de códigos de Firebase concretos para una pantalla.
 */
export function errorMessage(err: unknown, overrides?: Record<string, string>): string {
  const code = errorCode(err);
  if (code?.startsWith('auth/')) return firebaseErrorMessage(code, overrides);
  if (err instanceof Error && err.name === 'ApiError') {
    // En un 400/409 el backend explica qué dato falló; es más útil que el mensaje genérico.
    const status = (err as { status?: unknown }).status;
    if (status === 400 || status === 409) return backendMessage(err) ?? err.message;
    return err.message;
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
