import { forwardRef, useId } from "react";
import {
  CONTROL_CLASSES,
  COUNTER_CLASSES,
  ERROR_CLASSES,
  HELPER_CLASSES,
  LABEL_CLASSES,
} from "./field-classes";
import { shouldShowCounter } from "./Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly label: string;
  readonly error?: string;
  readonly helperText?: string;
  /**
   * Controls the `{current} / {max}` counter shown below the textarea.
   * Defaults to `"auto"` (shown when `maxLength` is set). Textareas benefit
   * from a counter more than inputs since they hold long-form content.
   */
  readonly counter?: boolean | "auto";
  readonly wrapperClassName?: string;
}

/**
 * Admin Textarea — the single multi-line text input for admin surfaces.
 * Shares layout and accessibility wiring with `Input`.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
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
      rows = 4,
      "aria-describedby": ariaDescribedBy,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const describedBy = [
      error ? errorId : undefined,
      !error && helperText ? helperId : undefined,
      ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className={wrapperClassName}>
        <label htmlFor={textareaId} className={LABEL_CLASSES}>
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`${CONTROL_CLASSES} resize-y ${className}`.trim()}
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
  },
);
