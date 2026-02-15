import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ error, className = "", ...props }, ref) {
    const base =
      "block w-full border-2 bg-input-bg px-4 py-3 text-white font-body focus:outline-none transition-colors sm:text-sm";
    const borderClass = error
      ? "border-accent"
      : "border-border-dark focus:border-accent";

    return (
      <input
        ref={ref}
        className={`${base} ${borderClass} ${className}`}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
    );
  },
);
