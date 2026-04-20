/**
 * Skeleton placeholders for loading states. Uses a subtle shimmer over the
 * surface-raised tone so empty rows don't feel like broken layout.
 */

const BASE = "animate-pulse rounded bg-admin-hover/70";

export function Skeleton({
  className = "",
}: {
  readonly className?: string;
}): React.ReactElement {
  return <div className={`${BASE} ${className}`} aria-hidden="true" />;
}

/** A single faux table row — matches the registrations table column shape. */
export function SkeletonRow(): React.ReactElement {
  return (
    <tr aria-hidden="true">
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-1.5 h-3 w-40" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-28" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="ml-auto h-4 w-6" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="ml-auto h-4 w-6" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-40" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-20 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="ml-auto h-4 w-16" />
      </td>
    </tr>
  );
}

/** Stats card-shaped placeholder. */
export function SkeletonStat(): React.ReactElement {
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border-default bg-surface-raised/50 px-5 py-4"
      aria-hidden="true"
    >
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-8 w-12" />
    </div>
  );
}
