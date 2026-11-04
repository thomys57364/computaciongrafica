import { Icon } from './Icon';

/** Tira de ruta del diseño: origen — avión — destino. */
export function RouteStrip({ origen, destino }: { origen: string; destino: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="min-w-0 flex-1 truncate text-title-md font-bold text-on-surface">{origen}</span>
      <span className="relative flex w-16 shrink-0 items-center justify-center" aria-hidden="true">
        <span className="h-[1.5px] w-full bg-divider" />
        <span className="absolute bg-card px-1.5 text-air">
          <Icon name="flight" filled className="rotate-90 text-[20px]" />
        </span>
      </span>
      <span className="min-w-0 flex-1 truncate text-right text-title-md font-bold text-on-surface">{destino}</span>
    </div>
  );
}
