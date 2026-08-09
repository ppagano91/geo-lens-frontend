import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";

interface HelpTooltipProps {
  text: string;
  label?: string;
  /** Preferred tooltip placement relative to the trigger. */
  placement?: "top" | "bottom";
}

function canHoverFinePointer(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return true;
  }
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/**
 * Compact info control: tooltip on hover/focus; tap toggles on touch devices.
 */
export default function HelpTooltip({
  text,
  label = "Ayuda",
  placement = "bottom",
}: HelpTooltipProps) {
  const tooltipId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`help-tooltip help-tooltip--${placement}${open ? " help-tooltip--open" : ""}`}
    >
      <button
        type="button"
        className="help-tooltip-trigger"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        title={text}
        onClick={() => {
          if (canHoverFinePointer()) {
            return;
          }
          setOpen((value) => !value);
        }}
        onFocus={() => setOpen(true)}
        onBlur={(event) => {
          const next = event.relatedTarget;
          if (next instanceof Node && rootRef.current?.contains(next)) {
            return;
          }
          setOpen(false);
        }}
        onMouseEnter={() => {
          if (canHoverFinePointer()) {
            setOpen(true);
          }
        }}
        onMouseLeave={() => {
          if (canHoverFinePointer()) {
            setOpen(false);
          }
        }}
      >
        <Info size={16} strokeWidth={2} aria-hidden="true" />
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className="help-tooltip-panel"
        hidden={!open}
      >
        {text}
      </div>
    </div>
  );
}
