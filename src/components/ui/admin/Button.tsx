import { forwardRef } from "react";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** When true, disables the button and shows an inline spinner. */
  readonly loading?: boolean;
  /** HTML button type. Defaults to `button` to avoid accidental form submits. */
  readonly type?: "button" | "submit" | "reset";
}

/**
 * Admin Button — the single button primitive for admin surfaces.
 *
 * Variants encode semantic intent (primary CTA, secondary action, ghost for
 * low-emphasis, danger for destructive). Size is compact by default so the
 * admin grids don't feel sparse.
 *
 * The `loading` prop turns the button into a spinner-bearing busy state that
 * also suppresses click handlers — callers never need to check a separate
 * submitting flag before firing state.
 *
 * Uses existing tokens from `globals.css` (`accent`, `border-dark`,
 * `dark-secondary`, `admin-text-*`, `admin-danger`). Tier B will introduce
 * richer design tokens; this component will adopt them without signature
 * changes.
 */

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--color-accent)] text-white border border-transparent " +
    "hover:brightness-110 active:brightness-95 " +
    "focus-visible:ring-[color:var(--color-accent)]/70",
  secondary:
    "bg-[color:var(--color-surface-2)] text-[color:var(--color-text-primary)] " +
    "border border-[color:var(--color-border)] " +
    "hover:bg-[color:var(--color-surface-3)] hover:border-[color:var(--color-border-strong)] " +
    "active:bg-[color:var(--color-surface-2)] " +
    "focus-visible:ring-[color:var(--color-border-strong)]",
  ghost:
    "bg-transparent text-[color:var(--color-text-secondary)] border border-transparent " +
    "hover:bg-[color:var(--color-surface-3)] hover:text-[color:var(--color-text-primary)] " +
    "active:bg-[color:var(--color-surface-2)] " +
    "focus-visible:ring-[color:var(--color-border-strong)]",
  danger:
    "bg-[color:var(--color-danger)] text-white border border-transparent " +
    "hover:brightness-110 active:brightness-95 " +
    "focus-visible:ring-[color:var(--color-danger)]/70",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-[var(--radius-sm)]",
  md: "px-4 py-2 text-sm gap-2 rounded-[var(--radius-md)]",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center font-medium tracking-tight " +
  "transition-[background-color,border-color,color,filter] " +
  "duration-[var(--motion-fast)] ease-[var(--ease-standard)] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-[color:var(--color-surface-0)] " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      type = "button",
      className = "",
      children,
      onClick,
      ...rest
    },
    ref,
  ) {
    const isBusy = loading;
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isBusy || undefined}
        data-variant={variant}
        data-size={size}
        className={[
          BASE_CLASSES,
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={(event) => {
          // Defensive: the DOM already blocks clicks on a disabled button, but
          // React synthetic events can still bubble in some edge cases. Guard
          // explicitly so loading always beats onClick.
          if (isDisabled) return;
          onClick?.(event);
        }}
        {...rest}
      >
        {loading ? <Spinner size="sm" className="-ml-0.5" /> : null}
        {children}
      </button>
    );
  },
);
