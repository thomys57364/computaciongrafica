import type { ReactNode } from 'react';

interface ScreenProps {
  children: ReactNode;
  /** Deja espacio para una <TopBar /> fija. */
  withTopBar?: boolean;
  className?: string;
}

/**
 * Contenedor de pantalla: ancho de móvil centrado, márgenes y áreas seguras.
 * El área segura inferior va en un espaciador al final y no como padding del <main>: `.pb-safe` se genera
 * después de `pb-24`/`pb-8` en el CSS y las anulaba, dejando el final de las listas tapado por la barra inferior.
 */
export function Screen({ children, withTopBar = false, className = '' }: ScreenProps) {
  const top = withTopBar ? 'pt-[calc(4rem+env(safe-area-inset-top,0px))]' : 'pt-safe';
  return (
    <main className={`mx-auto flex min-h-[100dvh] w-full max-w-app flex-col px-margin-mobile ${top} ${className}`}>
      {children}
      <div aria-hidden="true" className="pb-safe" />
    </main>
  );
}
