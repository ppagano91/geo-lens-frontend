import type { ReactNode } from "react";

interface ActionRowProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** Compact toolbar row for icon actions. */
export default function ActionRow({
  label,
  children,
  className = "",
}: ActionRowProps) {
  return (
    <div
      className={`aoi-icon-toolbar action-row${className ? ` ${className}` : ""}`}
      role="toolbar"
      aria-label={label}
    >
      {children}
    </div>
  );
}
