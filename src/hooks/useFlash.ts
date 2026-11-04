import { useState } from 'react';
import { useLocation } from 'react-router-dom';

export type FlashTone = 'success' | 'info';

/**
 * Mensaje que una pantalla anterior dejó en `navigate(..., { state: { flash, flashTone } })`.
 * Por defecto es de éxito; `flashTone: 'info'` sirve para avisos (p. ej. «no encontramos esa encomienda»).
 */
export function useFlash() {
  const state = useLocation().state as { flash?: unknown; flashTone?: unknown } | null;
  const [flash, setFlash] = useState<string | null>(typeof state?.flash === 'string' ? state.flash : null);
  const tone: FlashTone = state?.flashTone === 'info' ? 'info' : 'success';
  return { flash, tone, dismiss: () => setFlash(null) };
}
