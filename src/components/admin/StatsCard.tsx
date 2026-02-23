interface StatsCardProps {
  readonly label: string;
  readonly value: number;
  readonly className?: string;
}

export function StatsCard({
  label,
  value,
  className = "",
}: StatsCardProps): React.ReactElement {
  return (
    <div
      className={`rounded-lg border border-border-dark border-l-2 border-l-accent bg-admin-card-bg p-6 ${className}`}
    >
      <p className="text-sm font-medium uppercase tracking-wider text-admin-text-secondary">{label}</p>
      <p className="mt-2 text-3xl font-bold text-admin-text-primary">{value}</p>
    </div>
  );
}
