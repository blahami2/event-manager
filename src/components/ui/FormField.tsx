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
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-bold uppercase tracking-wide text-text-gray"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
