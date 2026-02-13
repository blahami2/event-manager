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
      className={`rounded-2xl bg-white p-6 shadow-lg ${className}`}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
