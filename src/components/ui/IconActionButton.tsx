import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: "default" | "danger" | "active";
  children: ReactNode;
}

/** Compact icon button with required accessible name via title + aria-label. */
export default function IconActionButton({
  label,
  tone = "default",
  children,
  className,
  ...rest
}: IconActionButtonProps) {
  const toneClass =
    tone === "danger"
      ? " icon-action-button--danger"
      : tone === "active"
        ? " icon-action-button--active"
        : "";

  return (
    <button
      type="button"
      className={`icon-action-button${toneClass}${className ? ` ${className}` : ""}`}
      title={label}
      aria-label={label}
      {...rest}
    >
      {children}
    </button>
  );
}
