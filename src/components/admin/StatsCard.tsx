interface StatsCardProps {
  readonly label: string;
  readonly value: number;
  readonly className?: string;
}

/**
 * Compact statistic card. Uses semantic tokens and a restrained layout —
 * a smallcaps label, a tabular-nums value, no gradients or glow effects.
 */
export function StatsCard({
  label,
  value,
  className = "",
}: StatsCardProps): React.ReactElement {
  return (
    <div
      className={[
        "rounded-[var(--radius-lg)] border border-[color:var(--color-border)]",
        "bg-[color:var(--color-surface-1)] px-5 py-4",
        "transition-colors duration-[var(--motion-fast)]",
        "hover:border-[color:var(--color-border-strong)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[color:var(--color-text-primary)]">
        {value}
      </p>
    </div>
  );
}
