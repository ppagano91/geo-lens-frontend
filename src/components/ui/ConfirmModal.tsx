import { useEffect, useId, useRef } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Dar de baja",
  cancelLabel = "Cancelar",
  confirming = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    cancelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !confirming) {
        onCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirming, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="confirm-modal-backdrop" role="presentation">
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h2 id={titleId} className="confirm-modal-title">
          {title}
        </h2>
        <p id={descriptionId} className="confirm-modal-message">
          {message}
        </p>
        <div className="confirm-modal-actions">
          <button
            ref={cancelRef}
            type="button"
            className="aoi-button aoi-button--secondary"
            onClick={onCancel}
            disabled={confirming}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="aoi-button aoi-button--danger"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? "Dando de baja..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
