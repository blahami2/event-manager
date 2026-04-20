import { forwardRef, useId } from "react";
import {
  CONTROL_CLASSES,
  COUNTER_CLASSES,
  ERROR_CLASSES,
  HELPER_CLASSES,
  LABEL_CLASSES,
} from "./field-classes";

/** Resolve the `counter` prop against the presence of `maxLength`. */
export function shouldShowCounter(
  counter: boolean | "auto",
  maxLength: number | undefined,
): boolean {
  if (typeof maxLength !== "number") return false;
  if (counter === "auto") return true;
  return counter;
}

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Visible label for the field. Required — every input needs one. */
  readonly label: string;
  /** Inline error message. When set, the field is marked invalid. */
  readonly error?: string;
  /** Helper text shown below the field when there is no error. */
  readonly helperText?: string;
  /**
   * Controls the `{current} / {max}` counter shown below the input.
   * - `"auto"` (default): counter is shown iff `maxLength` is set.
   * - `true`: always show (requires `maxLength`).
   * - `false`: never show.
   */
  readonly counter?: boolean | "auto";
  /** Wrapper className for layout (grid positioning, etc.). */
  readonly wrapperClassName?: string;
}

/**
 * Admin Input — the single text input primitive for admin surfaces.
 * Composes label + control + helper/error/counter with accessible wiring.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    counter = "auto",
    wrapperClassName = "",
    id,
    className = "",
    value,
    maxLength,
    "aria-describedby": ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const describedBy = [
    error ? errorId : undefined,
    !error && helperText ? helperId : undefined,
    ariaDescribedBy,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const currentLength =
    typeof value === "string"
      ? value.length
      : typeof value === "number"
        ? String(value).length
        : 0;

  return (
    <div className={wrapperClassName}>
      <label htmlFor={inputId} className={LABEL_CLASSES}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`${CONTROL_CLASSES} ${className}`.trim()}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        value={value}
        maxLength={maxLength}
        {...rest}
      />
      <div className="flex items-start justify-between gap-3">
        {error ? (
          <p id={errorId} role="alert" className={ERROR_CLASSES}>
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className={HELPER_CLASSES}>
            {helperText}
          </p>
        ) : (
          <span />
        )}
        {shouldShowCounter(counter, maxLength) ? (
          <p className={COUNTER_CLASSES} aria-hidden="true">
            {currentLength} / {maxLength}
          </p>
        ) : null}
      </div>
    </div>
  );
});
