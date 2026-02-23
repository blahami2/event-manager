"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { RegistrationStatus } from "@/types/registration";

export interface RegistrationFiltersProps {
  readonly status: string;
  readonly search: string;
  readonly onStatusChange: (status: string) => void;
  readonly onSearchChange: (search: string) => void;
}

export function RegistrationFilters({
  status,
  search,
  onStatusChange,
  onSearchChange,
}: RegistrationFiltersProps): React.ReactElement {
  const t = useTranslations("admin.registrations.filters");

  const statusOptions = [
    { value: "", labelKey: "all" },
    { value: RegistrationStatus.CONFIRMED, labelKey: "confirmed" },
    { value: RegistrationStatus.CANCELLED, labelKey: "cancelled" },
  ] as const;

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onStatusChange(e.target.value);
    },
    [onStatusChange],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange],
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div>
        <label htmlFor="status-filter" className="sr-only">
          {t("statusLabel")}
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={handleStatusChange}
          className="rounded-lg border border-border-dark bg-dark-secondary/80 px-4 py-2.5 text-sm text-admin-text-primary shadow-sm backdrop-blur-sm transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label htmlFor="search-input" className="sr-only">
          {t("searchLabel")}
        </label>
        <input
          id="search-input"
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={handleSearchChange}
          className="w-full rounded-lg border border-border-dark bg-dark-secondary/80 px-4 py-2.5 text-sm text-admin-text-primary placeholder:text-admin-text-secondary/70 shadow-sm backdrop-blur-sm transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:max-w-xs"
        />
      </div>
    </div>
  );
}
