/**
 * Shared CSS class strings for admin form fields. Centralising these here
 * guarantees visual consistency across Input / Textarea / Select primitives —
 * tweak the focus ring here and every field picks it up automatically.
 */

/** Classes applied to the <label> element. */
export const LABEL_CLASSES =
  "mb-1.5 block text-xs font-medium tracking-wide text-[color:var(--color-text-secondary)]";

/**
 * Classes applied to the form control itself (input / select / textarea).
 * Focus ring is made visible on dark backgrounds by using a bright accent
 * ring. The `aria-invalid` attribute flips the border to the danger color.
 */
export const CONTROL_CLASSES =
  "block w-full rounded-[var(--radius-md)] " +
  "border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] " +
  "px-3 py-2 text-sm text-[color:var(--color-text-primary)] " +
  "placeholder:text-[color:var(--color-text-tertiary)] " +
  "shadow-[var(--shadow-xs)] " +
  "transition-[border-color,box-shadow] duration-[var(--motion-fast)] ease-[var(--ease-standard)] " +
  "focus:outline-none focus:border-[color:var(--color-accent)] " +
  "focus:ring-2 focus:ring-[color:var(--color-accent)]/45 " +
  "aria-invalid:border-[color:var(--color-danger)] " +
  "aria-invalid:focus:ring-[color:var(--color-danger)]/45 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

/** Classes for the helper / error text below the field. */
export const HELPER_CLASSES =
  "mt-1 text-xs text-[color:var(--color-text-tertiary)]";
export const ERROR_CLASSES =
  "mt-1 text-xs text-[color:var(--color-danger)]";
export const COUNTER_CLASSES =
  "mt-1 ml-auto text-xs text-[color:var(--color-text-tertiary)] tabular-nums";
