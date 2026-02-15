interface CardProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function Card({
  children,
  className = "",
}: CardProps): React.ReactElement {
  return (
    <div
      className={`border-2 border-border-dark bg-dark-primary p-6 sm:p-8 lg:p-10 ${className}`}
    >
      {children}
    </div>
  );
}
