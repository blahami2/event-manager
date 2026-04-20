interface StatsCardProps {
  readonly label: string;
  readonly value: number;
  readonly className?: string;
}

export function StatsCard({ label, value, className = "" }: StatsCardProps): React.ReactElement {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-border-dark bg-dark-secondary/60 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-accent/10 hover:border-border-dark/80 ${className}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent to-red-600 opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/5 blur-2xl transition-all duration-300 group-hover:bg-accent/15" />
      <div className="relative z-10">
        <p className="text-sm font-medium uppercase tracking-wider text-admin-text-secondary transition-colors duration-300 group-hover:text-admin-text-primary/80">
          {label}
        </p>
        <p className="mt-3 text-4xl font-bold tracking-tight text-white">{value}</p>
      </div>
    </div>
  );
}
