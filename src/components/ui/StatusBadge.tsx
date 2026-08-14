export type StatusBadgeTone = "ok" | "warn" | "muted" | "neutral";

interface StatusBadgeProps {
  label: string;
  tone?: StatusBadgeTone;
  title?: string;
}

/** Compact status chip for sensor, compatibility, file presence, etc. */
export default function StatusBadge({
  label,
  tone = "neutral",
  title,
}: StatusBadgeProps) {
  return (
    <span
      className={`status-badge status-badge--${tone}`}
      title={title ?? label}
    >
      {label}
    </span>
  );
}
