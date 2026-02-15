interface FormFieldProps {
  readonly label: string;
  readonly htmlFor: string;
  readonly error?: string;
  readonly children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  children,
}: FormFieldProps): React.ReactElement {
  return (
    // .form-group { margin-bottom:25px; text-align:left }
    <div style={{ marginBottom: "25px", textAlign: "left" }}>
      {/* .form-label { display:block; margin-bottom:10px; font-weight:700; text-transform:uppercase } */}
      <label
        htmlFor={htmlFor}
        style={{
          display: "block",
          marginBottom: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm text-accent" role="alert" style={{ marginTop: "5px" }}>
          {error}
        </p>
      )}
    </div>
  );
}
