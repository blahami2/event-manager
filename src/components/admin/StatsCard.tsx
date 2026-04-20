interface StatsCardProps {
  readonly label: string;
  readonly value: number;
  readonly accent?: boolean;
  readonly className?: string;
}

/**
 * A single compact statistic panel. Numbers use a tabular mono face so a row
 * of cards visually aligns even when values differ in width.
 */
export function StatsCard({
  label,
  value,
  accent = false,
  className = "",
}: StatsCardProps): React.ReactElement {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border-default bg-surface-raised/50 px-5 py-4 transition-colors duration-200 hover:border-border-strong ${className}`}
    >
      {accent ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-0.5 bg-accent"
        />
      ) : null}
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
        {label}
      </p>
      <p className="mt-2 font-mono text-3xl font-medium tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}
