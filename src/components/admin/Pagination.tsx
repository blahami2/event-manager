"use client";

export interface PaginationProps {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps): React.ReactElement | null {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-dark/50 px-6 py-4">
      <p className="text-sm text-admin-text-secondary">
        Showing <span className="font-medium text-admin-text-primary">{start}</span> to{" "}
        <span className="font-medium text-admin-text-primary">{end}</span> of{" "}
        <span className="font-medium text-admin-text-primary">{total}</span> results
      </p>
      <nav className="flex items-center gap-2" aria-label="Pagination">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-border-dark bg-dark-secondary/60 px-4 py-2 text-sm font-medium text-admin-text-secondary shadow-sm backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border-dark disabled:hover:bg-dark-secondary/60"
        >
          Previous
        </button>
        <span className="flex items-center px-4 text-sm font-medium text-admin-text-secondary">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-border-dark bg-dark-secondary/60 px-4 py-2 text-sm font-medium text-admin-text-secondary shadow-sm backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border-dark disabled:hover:bg-dark-secondary/60"
        >
          Next
        </button>
      </nav>
    </div>
  );
}
