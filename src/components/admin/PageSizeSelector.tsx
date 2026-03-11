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
      <label htmlFor="page-size-select" className="text-sm text-admin-text-secondary">
        {t("rowsPerPage")}
      </label>
      <select
        id="page-size-select"
        value={pageSize}
        onChange={handleChange}
        aria-label={t("rowsPerPage")}
        className="rounded-lg border border-border-dark bg-dark-secondary/80 px-3 py-1.5 text-sm text-admin-text-primary shadow-sm backdrop-blur-sm transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        {PAGE_SIZE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
