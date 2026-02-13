import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ error, className = "", ...props }, ref) {
    const base =
      "block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 sm:text-sm";
    const borderClass = error
      ? "border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:ring-indigo-500";

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
