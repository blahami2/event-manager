/**
 * Shared CSS class strings for admin form fields. Centralising these here
 * guarantees visual consistency across Input / Textarea / Select primitives.
 */

export const LABEL_CLASSES =
  "mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-text-tertiary";

export const CONTROL_CLASSES =
  "block w-full rounded-md border border-border-default bg-surface-sunken px-3 py-2 " +
  "text-sm text-text-primary placeholder:text-text-tertiary " +
  "transition-colors duration-150 " +
  "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring focus:ring-offset-0 " +
  "aria-invalid:border-danger aria-invalid:focus:ring-danger/40 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export const HELPER_CLASSES = "mt-1 text-xs text-text-tertiary";
export const ERROR_CLASSES = "mt-1 text-xs text-danger";
export const COUNTER_CLASSES = "mt-1 ml-auto text-xs font-mono tabular-nums text-text-tertiary";
