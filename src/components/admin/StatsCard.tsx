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
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}
