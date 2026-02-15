import { forwardRef } from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ error, className = "", ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`form-input ${className}`}
        style={{
          width: "100%",
          padding: "15px",
          background: "#222",
          border: error ? "2px solid var(--color-accent)" : "2px solid #333",
          color: "#fff",
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "1rem",
        }}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
    );
  },
);
