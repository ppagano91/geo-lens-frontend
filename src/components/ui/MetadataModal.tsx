import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import IconButton from "./IconButton";

interface MetadataModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

/** Dialog for bulky metadata so it does not occupy the sidebar by default. */
export default function MetadataModal({
  open,
  title,
  children,
  onClose,
}: MetadataModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="confirm-modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="confirm-modal metadata-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="metadata-modal-header">
          <h2 id={titleId} className="confirm-modal-title">
            {title}
          </h2>
          <IconButton
            ref={closeRef}
            label="Cerrar metadata"
            onClick={onClose}
          >
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </IconButton>
        </header>
        <div className="metadata-modal-body">{children}</div>
      </div>
    </div>
  );
}
