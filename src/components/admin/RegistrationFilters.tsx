"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  AccommodationOption,
  RegistrationStatus,
  StayOption,
} from "@/types/registration";
import {
  ACCOMMODATION_OPTIONS,
  CURRENT_STAY_OPTIONS,
  accommodationLabel,
  stayLabel,
} from "@/i18n/labels";

export interface RegistrationFiltersProps {
  readonly status: string;
  readonly search: string;
  readonly stay: string;
  readonly accommodation: string;
  readonly onStatusChange: (status: string) => void;
  readonly onSearchChange: (search: string) => void;
  readonly onStayChange: (stay: string) => void;
  readonly onAccommodationChange: (accommodation: string) => void;
  readonly onClearAll: () => void;
}

const CONTROL_CLASSES =
  "block w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] " +
  "bg-[color:var(--color-surface-1)] px-3 py-2 text-sm text-[color:var(--color-text-primary)] " +
  "placeholder:text-[color:var(--color-text-tertiary)] shadow-[var(--shadow-xs)] " +
  "transition-colors duration-[var(--motion-fast)] " +
  "focus:outline-none focus:border-[color:var(--color-accent)] focus:ring-2 focus:ring-[color:var(--color-accent)]/40";

/**
 * A "filter chip" visually represents an active filter value. Clicking the
 * chip clears just that filter (a common UX for removable tags).
 */
function FilterChip({
  label,
  onClear,
}: {
  readonly label: string;
  readonly onClear: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2.5 py-1 text-xs text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-3)] hover:text-[color:var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/60"
    >
      <span>{label}</span>
      <svg
        className="h-3 w-3 opacity-60"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M6 6l12 12M6 18L18 6" />
      </svg>
    </button>
  );
}

export function RegistrationFilters({
  status,
  search,
  stay,
  accommodation,
  onStatusChange,
  onSearchChange,
  onStayChange,
  onAccommodationChange,
  onClearAll,
}: RegistrationFiltersProps): React.ReactElement {
  const t = useTranslations("admin.registrations.filters");
  const tReg = useTranslations("admin.registrations");
  const tEnums = useTranslations();

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onStatusChange(e.target.value),
    [onStatusChange],
  );
  const handleStayChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => onStayChange(e.target.value),
    [onStayChange],
  );
  const handleAccommodationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      onAccommodationChange(e.target.value),
    [onAccommodationChange],
  );
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value),
    [onSearchChange],
  );

  const hasAnyActive = Boolean(status || stay || accommodation || search);

  const statusValueLabel =
    status === RegistrationStatus.CONFIRMED
      ? t("confirmed")
      : status === RegistrationStatus.CANCELLED
        ? t("cancelled")
        : "";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="sm:w-40">
          <label htmlFor="status-filter" className="sr-only">
            {t("statusLabel")}
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={handleStatusChange}
            className={CONTROL_CLASSES}
          >
            <option value="">{t("all")}</option>
            <option value={RegistrationStatus.CONFIRMED}>{t("confirmed")}</option>
            <option value={RegistrationStatus.CANCELLED}>{t("cancelled")}</option>
          </select>
        </div>

        <div className="sm:w-48">
          <label htmlFor="stay-filter" className="sr-only">
            {tReg("filtersApplyStay")}
          </label>
          <select
            id="stay-filter"
            value={stay}
            onChange={handleStayChange}
            className={CONTROL_CLASSES}
            aria-label={tReg("filtersApplyStay")}
          >
            <option value="">{tReg("filtersApplyStay")}</option>
            {CURRENT_STAY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {stayLabel(opt, tEnums)}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:w-56">
          <label htmlFor="accommodation-filter" className="sr-only">
            {tReg("filtersApplyAccommodation")}
          </label>
          <select
            id="accommodation-filter"
            value={accommodation}
            onChange={handleAccommodationChange}
            className={CONTROL_CLASSES}
            aria-label={tReg("filtersApplyAccommodation")}
          >
            <option value="">{tReg("filtersApplyAccommodation")}</option>
            {ACCOMMODATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {accommodationLabel(opt, tEnums)}
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
            className={CONTROL_CLASSES}
          />
        </div>
      </div>

      {hasAnyActive ? (
        <div className="flex flex-wrap items-center gap-2">
          {status ? (
            <FilterChip
              label={statusValueLabel}
              onClear={() => onStatusChange("")}
            />
          ) : null}
          {stay ? (
            <FilterChip
              label={stayLabel(stay as StayOption, tEnums)}
              onClear={() => onStayChange("")}
            />
          ) : null}
          {accommodation ? (
            <FilterChip
              label={accommodationLabel(
                accommodation as AccommodationOption,
                tEnums,
              )}
              onClear={() => onAccommodationChange("")}
            />
          ) : null}
          {search ? (
            <FilterChip
              label={tReg("filtersActiveSearch", { query: search })}
              onClear={() => onSearchChange("")}
            />
          ) : null}
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-[color:var(--color-text-secondary)] underline-offset-2 transition-colors hover:text-[color:var(--color-text-primary)] hover:underline focus:outline-none focus-visible:underline"
          >
            {tReg("clearFilters")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
