"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export interface PageSizeSelectorProps {
  readonly pageSize: number;
  readonly onPageSizeChange: (pageSize: number) => void;
}

export function PageSizeSelector({ pageSize, onPageSizeChange }: PageSizeSelectorProps): React.ReactElement {
  const t = useTranslations("admin.registrations.pagination");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onPageSizeChange(Number(e.target.value));
    },
    [onPageSizeChange],
  );

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="page-size-select" className="text-sm text-text-secondary">
        {t("rowsPerPage")}
      </label>
      <div className="relative">
        <select
          id="page-size-select"
          value={pageSize}
          onChange={handleChange}
          aria-label={t("rowsPerPage")}
          className="appearance-none rounded-md border border-border-default bg-surface-sunken py-1.5 pl-3 pr-8 font-mono text-sm tabular-nums text-text-primary transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-ring"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </div>
    </div>
  );
}
