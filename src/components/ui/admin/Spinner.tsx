import type { CSSProperties } from "react";

export interface SpinnerProps {
  /** Spinner diameter token. `sm` for inline/button usage, `md` for panels. */
  readonly size?: "sm" | "md";
  /**
   * Visually-hidden label for screen readers. If the spinner is decorative
   * (e.g., inside a button that already describes its state), pass a non-empty
   * string like "Loading" anyway so assistive tech has something to announce.
   */
  readonly label?: string;
  /** Optional className for layout (margins, centering). */
  readonly className?: string;
}

const SIZE_PX: Record<NonNullable<SpinnerProps["size"]>, number> = {
  sm: 14,
  md: 20,
};

/**
 * Minimal accessible spinner. Rendered as a CSS-only ring so the same
 * component works inside buttons (inline) and panels (block).
 *
 * Uses the `spin` animation defined in `globals.css` (Tailwind's default
 * `animate-spin` keyframes are mapped there).
 */
export function Spinner({
  size = "sm",
  label,
  className = "",
}: SpinnerProps): React.ReactElement {
  const diameter = SIZE_PX[size];
  const style: CSSProperties = {
    width: diameter,
    height: diameter,
  };

  return (
    <span
      role="status"
      aria-live="polite"
      data-size={size}
      className={`inline-block align-[-2px] ${className}`}
    >
      <span
        aria-hidden="true"
        className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
        style={style}
      />
      {label ? (
        <span className="sr-only">{label}</span>
      ) : null}
    </span>
  );
}
