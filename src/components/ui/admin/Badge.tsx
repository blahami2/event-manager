export type BadgeVariant = "success" | "warning" | "danger" | "neutral";

export interface BadgeProps {
  readonly variant?: BadgeVariant;
  readonly className?: string;
  readonly children: React.ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success:
    "bg-success-muted text-success ring-1 ring-inset ring-success/25",
  warning:
    "bg-warning-muted text-warning ring-1 ring-inset ring-warning/25",
  danger:
    "bg-danger-muted text-danger ring-1 ring-inset ring-danger/25",
  neutral:
    "bg-admin-hover text-text-secondary ring-1 ring-inset ring-border-default",
};

const BASE_CLASSES =
  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider";

/**
 * Semantic badge primitive. Paired with a leading dot to make status pills
 * legible even at small sizes — the dot carries the hue, the label the meaning.
 */
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
      <span
        aria-hidden="true"
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          variant === "success"
            ? "bg-success"
            : variant === "warning"
              ? "bg-warning"
              : variant === "danger"
                ? "bg-danger"
                : "bg-text-tertiary"
        }`}
      />
      {children}
    </span>
  );
}
