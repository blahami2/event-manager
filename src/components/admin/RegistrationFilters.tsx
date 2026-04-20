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

const CONTROL_BASE =
  "block w-full rounded-md border border-border-default bg-surface-sunken " +
  "text-sm text-text-primary placeholder:text-text-tertiary " +
  "transition-colors duration-150 " +
  "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring focus:ring-offset-0";

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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
      <div className="sm:w-52">
        <label htmlFor="status-filter" className="sr-only">
          {t("statusLabel")}
        </label>
        <div className="relative">
          <select
            id="status-filter"
            value={status}
            onChange={handleStatusChange}
            className={`${CONTROL_BASE} appearance-none px-3 py-2 pr-9`}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </div>
      </div>
      <div className="relative flex-1">
        <label htmlFor="search-input" className="sr-only">
          {t("searchLabel")}
        </label>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
        <input
          id="search-input"
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={handleSearchChange}
          className={`${CONTROL_BASE} px-3 py-2 pl-9`}
        />
      </div>
    </div>
  );
}
