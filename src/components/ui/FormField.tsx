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
    <div className="space-y-1">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
