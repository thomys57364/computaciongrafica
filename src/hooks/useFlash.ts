import { useState } from 'react';
import { useLocation } from 'react-router-dom';

/** Mensaje de éxito que una pantalla anterior dejó en `navigate(..., { state: { flash } })`. */
export function useFlash() {
  const initial = (useLocation().state as { flash?: unknown } | null)?.flash;
  const [flash, setFlash] = useState<string | null>(typeof initial === 'string' ? initial : null);
  return { flash, dismiss: () => setFlash(null) };
}
