import { Button } from './Button';

interface ConfirmInlineProps {
  /** Pregunta de confirmación (p. ej. «¿Cancelar este viaje?…»). */
  message: string;
  confirmLabel: string;
  loadingText: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación dentro de la tarjeta para acciones destructivas (cancelar viaje, eliminar encomienda). */
export function ConfirmInline({ message, confirmLabel, loadingText, loading, onConfirm, onCancel }: ConfirmInlineProps) {
  return (
    <div className="flex flex-col gap-2 rounded-control bg-error-bg p-3">
      <p className="text-body-sm font-medium text-wine">{message}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onCancel} disabled={loading} className="!min-h-11">
          No, volver
        </Button>
        <Button loading={loading} loadingText={loadingText} onClick={onConfirm} className="!min-h-11">
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
