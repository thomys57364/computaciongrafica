/**
 * Interruptores de funciones. Google Sign-In falla por ahora: queda oculto salvo que el .env lo active
 * con VITE_ENABLE_GOOGLE_SIGNIN=true. El login con correo no depende de esto.
 */
export const GOOGLE_SIGNIN_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_SIGNIN === 'true';
