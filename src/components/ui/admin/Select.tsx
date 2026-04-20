import { forwardRef, useId } from "react";
import {
  CONTROL_CLASSES,
  ERROR_CLASSES,
  HELPER_CLASSES,
  LABEL_CLASSES,
} from "./field-classes";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  readonly label: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly wrapperClassName?: string;
}

/**
 * Admin Select — the single dropdown primitive for admin surfaces.
 * Consumers pass `<option>` children as usual.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    error,
    helperText,
    wrapperClassName = "",
    id,
    className = "",
    children,
    "aria-describedby": ariaDescribedBy,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  const describedBy = [
    error ? errorId : undefined,
    !error && helperText ? helperId : undefined,
    ariaDescribedBy,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={wrapperClassName}>
      <label htmlFor={selectId} className={LABEL_CLASSES}>
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`${CONTROL_CLASSES} appearance-none pr-9 ${className}`.trim()}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </div>
      {error ? (
        <p id={errorId} role="alert" className={ERROR_CLASSES}>
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className={HELPER_CLASSES}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
});
