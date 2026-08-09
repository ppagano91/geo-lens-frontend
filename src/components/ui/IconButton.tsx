import type { ButtonHTMLAttributes, ReactNode } from "react";

export type IconButtonTone = "default" | "primary" | "danger" | "ghost";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name; also used as native title tooltip. */
  label: string;
  tone?: IconButtonTone;
  children: ReactNode;
}

/** Compact icon-only button with aria-label, title, and focusable keyboard support. */
export default function IconButton({
  label,
  tone = "default",
  children,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  const toneClass =
    tone === "primary"
      ? " icon-button--primary"
      : tone === "danger"
        ? " icon-button--danger"
        : tone === "ghost"
          ? " icon-button--ghost"
          : "";

  return (
    <button
      type={type}
      className={`icon-button${toneClass}${className ? ` ${className}` : ""}`}
      title={label}
      aria-label={label}
      {...rest}
    >
      {children}
    </button>
  );
}
