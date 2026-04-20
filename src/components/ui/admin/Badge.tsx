export type BadgeVariant = "success" | "warning" | "danger" | "neutral";

export interface BadgeProps {
  readonly variant?: BadgeVariant;
  readonly className?: string;
  readonly children: React.ReactNode;
}

/**
 * Semantic badge primitive. Replaces the hardcoded green/red status pills
 * scattered across admin pages. Colours map to semantic tokens rather than
 * specific hues so Tier B's token overhaul flows through automatically.
 */
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success:
    "bg-admin-success/15 text-admin-success border border-admin-success/30",
  warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  danger:
    "bg-admin-danger/15 text-admin-danger border border-admin-danger/30",
  neutral:
    "bg-admin-hover text-admin-text-secondary border border-border-dark",
};

const BASE_CLASSES =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold";

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
