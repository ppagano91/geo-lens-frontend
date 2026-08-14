import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

interface HelpTooltipProps {
  text: string;
  label?: string;
  /** Preferred tooltip placement relative to the trigger. */
  placement?: "top" | "bottom";
}

interface TooltipCoords {
  top: number;
  left: number;
  placement: "top" | "bottom";
}

function canHoverFinePointer(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return true;
  }
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function positionFromTrigger(
  trigger: HTMLElement,
  preferred: "top" | "bottom",
): TooltipCoords {
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const estimatedHeight = 72;
  let placement = preferred;
  if (preferred === "bottom" && spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
    placement = "top";
  } else if (
    preferred === "top" &&
    spaceAbove < estimatedHeight &&
    spaceBelow > spaceAbove
  ) {
    placement = "bottom";
  }

  const maxWidth = Math.min(288, window.innerWidth - 16);
  const half = maxWidth / 2;
  const left = Math.min(
    Math.max(rect.left + rect.width / 2, half + 8),
    window.innerWidth - half - 8,
  );
  const top =
    placement === "bottom" ? rect.bottom + 6 : Math.max(8, rect.top - 6);

  return { top, left, placement };
}

/**
 * Compact info control: tooltip on hover/focus; tap toggles on touch devices.
 * The panel is portaled to ``document.body`` so overflow/z-index of the
 * sidebar, cards, and map cannot clip it.
 */
export default function HelpTooltip({
  text,
  label = "Ayuda",
  placement = "bottom",
}: HelpTooltipProps) {
  const tooltipId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    setCoords(positionFromTrigger(trigger, placement));
  };

  const show = () => {
    updatePosition();
    setOpen(true);
  };

  const hide = () => {
    setOpen(false);
  };

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updatePosition();
  }, [open, placement, text]);

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
        hide();
      }
    };

    const onReposition = () => {
      updatePosition();
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    document.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      document.removeEventListener("scroll", onReposition, true);
    };
  }, [open, placement]);

  const panel =
    open && coords
      ? createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className={`help-tooltip-panel help-tooltip-panel--portal help-tooltip-panel--${coords.placement}`}
            style={{ top: coords.top, left: coords.left }}
          >
            {text}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      ref={rootRef}
      className={`help-tooltip help-tooltip--${placement}${open ? " help-tooltip--open" : ""}`}
    >
      <button
        ref={triggerRef}
        type="button"
        className="help-tooltip-trigger"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onClick={() => {
          if (canHoverFinePointer()) {
            return;
          }
          if (open) {
            hide();
            return;
          }
          show();
        }}
        onFocus={show}
        onBlur={(event) => {
          const next = event.relatedTarget;
          if (next instanceof Node && rootRef.current?.contains(next)) {
            return;
          }
          hide();
        }}
        onMouseEnter={() => {
          if (canHoverFinePointer()) {
            show();
          }
        }}
        onMouseLeave={() => {
          if (canHoverFinePointer()) {
            hide();
          }
        }}
      >
        <Info size={16} strokeWidth={2} aria-hidden="true" />
      </button>
      {panel}
    </div>
  );
}
