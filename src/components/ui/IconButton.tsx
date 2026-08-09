import type { ButtonHTMLAttributes, ReactNode } from "react";

export type IconButtonTone = "default" | "primary" | "danger" | "ghost";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name; also used as native title tooltip. */
  label: string;
  /** Optional short visible label (mixed icon + text). */
  text?: string;
  tone?: IconButtonTone;
  children: ReactNode;
}

/** Compact icon button with aria-label, title, and focusable keyboard support. */
export default function IconButton({
  label,
  text,
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
  const withTextClass = text ? " icon-button--with-text" : "";

  return (
    <button
      type={type}
      className={`icon-button${toneClass}${withTextClass}${className ? ` ${className}` : ""}`}
      title={label}
      aria-label={label}
      {...rest}
    >
      {children}
      {text ? <span className="icon-button-text">{text}</span> : null}
    </button>
  );
}
