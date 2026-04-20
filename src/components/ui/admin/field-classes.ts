/**
 * Shared CSS class strings for admin form fields. Centralising these here
 * guarantees visual consistency across Input / Textarea / Select primitives —
 * if you tweak the focus ring, every field picks the change up automatically.
 */

/** Classes applied to the <label> element. */
export const LABEL_CLASSES =
  "mb-1.5 block text-sm font-medium text-admin-text-secondary";

/**
 * Classes applied to the form control itself (input / select / textarea).
 * Focus ring is made visible on dark backgrounds by using a bright accent
 * ring. The `aria-invalid` attribute flips the border to the danger color.
 */
export const CONTROL_CLASSES =
  "block w-full rounded-md border border-border-dark bg-input-bg px-3 py-2 " +
  "text-sm text-admin-text-primary placeholder:text-admin-text-secondary/60 " +
  "shadow-sm transition-colors duration-150 " +
  "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/40 " +
  "aria-invalid:border-admin-danger aria-invalid:focus:ring-admin-danger/40 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

/** Classes for the helper / error text below the field. */
export const HELPER_CLASSES = "mt-1 text-xs text-admin-text-secondary";
export const ERROR_CLASSES = "mt-1 text-xs text-admin-danger";
export const COUNTER_CLASSES =
  "mt-1 ml-auto text-xs text-admin-text-secondary";
