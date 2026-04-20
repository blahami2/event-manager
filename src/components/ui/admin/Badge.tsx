export type BadgeVariant = "success" | "warning" | "danger" | "neutral";

export interface BadgeProps {
  readonly variant?: BadgeVariant;
  readonly className?: string;
  readonly children: React.ReactNode;
}

/**
 * Semantic badge primitive. Colours map to semantic tokens rather than
 * specific hues so the design system can evolve centrally.
 */
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success:
    "bg-[color:var(--color-success)]/12 text-[color:var(--color-success)] ring-1 ring-inset ring-[color:var(--color-success)]/25",
  warning:
    "bg-[color:var(--color-warning)]/12 text-[color:var(--color-warning)] ring-1 ring-inset ring-[color:var(--color-warning)]/25",
  danger:
    "bg-[color:var(--color-danger)]/12 text-[color:var(--color-danger)] ring-1 ring-inset ring-[color:var(--color-danger)]/25",
  neutral:
    "bg-[color:var(--color-surface-3)] text-[color:var(--color-text-secondary)] ring-1 ring-inset ring-[color:var(--color-border)]",
};

const BASE_CLASSES =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide";

export function Badge({
  variant = "neutral",
  className = "",
  children,
}: BadgeProps): React.ReactElement {
  return (
    <span
      data-variant={variant}
      className={[BASE_CLASSES, VARIANT_CLASSES[variant], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
