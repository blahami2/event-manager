export interface EmptyStateProps {
  /** Large heading summarising the state. */
  readonly title: string;
  /** Supporting copy that explains what to do next. */
  readonly description?: string;
  /** Optional decorative icon rendered above the title. */
  readonly icon?: React.ReactNode;
  /** Optional CTA (typically a Button). */
  readonly action?: React.ReactNode;
  readonly className?: string;
}

/**
 * EmptyState — the component to render when a list/table has no content.
 *
 * Designed to feel intentional rather than apologetic: a decorative icon,
 * a title, clarifying copy, and a primary action for the most likely
 * next step.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-4",
        "rounded-xl border border-dashed border-[color:var(--color-border)]",
        "bg-[color:var(--color-surface-2)]/40 px-6 py-16 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-surface-3)] text-admin-text-secondary"
        >
          {icon}
        </div>
      ) : null}
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-admin-text-primary">
          {title}
        </h3>
        {description ? (
          <p className="max-w-sm text-sm text-admin-text-secondary">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
