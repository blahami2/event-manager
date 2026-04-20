/**
 * Page-size change resolver used by the admin registrations page.
 *
 * When the user picks a new "rows per page" value, we keep them on the
 * current page when the new page size still surfaces their data. We only
 * clamp to the new last page if the current page would otherwise be
 * empty — this avoids the common UX annoyance where a page-size change
 * silently drops the user back to page 1.
 */
export interface ResolvePageArgs {
  readonly currentPage: number;
  readonly newPageSize: number;
  readonly total: number;
}

export function resolvePageAfterPageSizeChange({
  currentPage,
  newPageSize,
  total,
}: ResolvePageArgs): number {
  const maxPageForNewSize = Math.max(1, Math.ceil(total / newPageSize));
  return Math.min(currentPage, maxPageForNewSize);
}
