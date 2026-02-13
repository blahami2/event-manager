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
      className={`rounded-2xl bg-white p-6 shadow-lg sm:p-8 lg:p-10 ${className}`}
    >
      {children}
    </div>
  );
}
