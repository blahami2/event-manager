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

/**
 * Compact filter bar for the registrations list. The search input is allowed
 * to grow to fill available space so typical search queries aren't clipped;
 * the status selector has a fixed width because its options are short.
 */
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

  // NOTE: the inputs are rendered as plain <select>/<input> (not the Input /
  // Select primitives) because the filter bar relies on visually-hidden
  // labels — the primitives always render a visible label above the field,
  // which would look odd in a compact filter strip. The classes are kept in
  // sync with the primitive's look via the shared CONTROL_CLASSES constant.
  const controlClasses =
    "block w-full rounded-md border border-border-dark bg-input-bg px-3 py-2 " +
    "text-sm text-admin-text-primary placeholder:text-admin-text-secondary/60 " +
    "shadow-sm transition-colors duration-150 " +
    "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/40";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <div className="sm:w-48">
        <label htmlFor="status-filter" className="sr-only">
          {t("statusLabel")}
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={handleStatusChange}
          className={controlClasses}
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
          className={controlClasses}
        />
      </div>
    </div>
  );
}
