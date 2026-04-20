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
    "bg-accent text-white border border-transparent " +
    "hover:bg-accent/90 active:bg-accent/80 " +
    "focus-visible:ring-accent/70",
  secondary:
    "bg-dark-secondary text-admin-text-primary border border-border-dark " +
    "hover:bg-admin-hover hover:text-white active:bg-dark-secondary " +
    "focus-visible:ring-border-dark",
  ghost:
    "bg-transparent text-admin-text-secondary border border-transparent " +
    "hover:bg-admin-hover hover:text-white active:bg-dark-secondary " +
    "focus-visible:ring-border-dark",
  danger:
    "bg-admin-danger text-white border border-transparent " +
    "hover:bg-admin-danger/90 active:bg-admin-danger/80 " +
    "focus-visible:ring-admin-danger/70",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-md font-medium " +
  "transition-colors duration-150 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-dark-primary " +
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
