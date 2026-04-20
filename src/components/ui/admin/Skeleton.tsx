export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Override the default "block" shape. Pass `"text"` for single-line text. */
  readonly shape?: "block" | "text" | "circle";
}

const SHAPE_CLASSES: Record<NonNullable<SkeletonProps["shape"]>, string> = {
  block: "rounded-md h-6",
  text: "rounded h-3.5",
  circle: "rounded-full",
};

/**
 * Generic shimmering placeholder. The shimmer animation is driven by the
 * `animate-skeleton` keyframes declared in `globals.css`.
 */
export function Skeleton({
  shape = "block",
  className = "",
  style,
  ...rest
}: SkeletonProps): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className={`animate-skeleton bg-[color:var(--color-surface-3)] ${SHAPE_CLASSES[shape]} ${className}`.trim()}
      style={style}
      {...rest}
    />
  );
}

export interface TableSkeletonProps {
  readonly rows?: number;
  readonly columns: number;
  /** Optional label announced to screen readers. */
  readonly label?: string;
}

/**
 * Table-shaped skeleton: a grid of shimmering cells matching the column
 * count of the real table. Rendered inside a table so cells land in sensible
 * DOM positions for assistive tech.
 */
export function TableSkeleton({
  rows = 5,
  columns,
  label,
}: TableSkeletonProps): React.ReactElement {
  return (
    <div
      role="presentation"
      aria-label={label}
      className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]"
    >
      <table className="min-w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr
              key={rowIdx}
              className={rowIdx % 2 === 0 ? "bg-transparent" : "bg-[color:var(--color-surface-3)]/40"}
            >
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
                  <Skeleton shape="text" style={{ width: `${40 + ((colIdx * 13 + rowIdx * 7) % 40)}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
