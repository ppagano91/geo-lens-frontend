import type { ReactNode } from "react";
import HelpTooltip from "./HelpTooltip";

interface SectionCardProps {
  title: string;
  help?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Grouped panel block with a compact title. */
export default function SectionCard({
  title,
  help,
  actions,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section className={`section-card${className ? ` ${className}` : ""}`}>
      <header className="section-card-header">
        <h3 className="section-card-title">{title}</h3>
        {help ? <HelpTooltip text={help} label={`Ayuda: ${title}`} /> : null}
        {actions ? <div className="section-card-actions">{actions}</div> : null}
      </header>
      <div className="section-card-body">{children}</div>
    </section>
  );
}
