import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ error, className = "", ...props }, ref) {
    return (
      // .form-input { width:100%; padding:15px; background:#222; border:2px solid #333; color:white; font-family:body; font-size:1rem; }
      // .form-input:focus { outline:none; border-color:accent }
      <input
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
