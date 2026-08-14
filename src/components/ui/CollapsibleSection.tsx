import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import HelpTooltip from "./HelpTooltip";

interface CollapsibleSectionProps {
  title: string;
  help?: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

/** Card whose body can be collapsed to keep heavy content off the default view. */
export default function CollapsibleSection({
  title,
  help,
  badge,
  defaultOpen = false,
  children,
  className = "",
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section
      className={`section-card collapsible-section${open ? " collapsible-section--open" : ""}${className ? ` ${className}` : ""}`}
    >
      <header className="section-card-header">
        <button
          type="button"
          className="collapsible-section-toggle"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="section-card-title">{title}</span>
          <ChevronDown
            size={16}
            strokeWidth={2}
            className={`collapsible-section-chevron${open ? " collapsible-section-chevron--open" : ""}`}
            aria-hidden="true"
          />
        </button>
        {badge ? <div className="collapsible-section-badge">{badge}</div> : null}
        {help ? <HelpTooltip text={help} label={`Ayuda: ${title}`} /> : null}
      </header>
      {open ? (
        <div id={contentId} className="section-card-body">
          {children}
        </div>
      ) : null}
    </section>
  );
}
