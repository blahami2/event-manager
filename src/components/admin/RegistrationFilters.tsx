"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  RegistrationStatus,
  StayOption,
  AccommodationOption,
} from "@/types/registration";

export interface RegistrationFiltersValue {
  readonly status: string;
  readonly stay: string;
  readonly accommodation: string;
  readonly search: string;
}

export interface RegistrationFiltersProps {
  readonly value: RegistrationFiltersValue;
  readonly onChange: (next: RegistrationFiltersValue) => void;
  readonly onReset: () => void;
}

const CONTROL_BASE =
  "block w-full rounded-md border border-border-default bg-surface-sunken " +
  "text-sm text-text-primary placeholder:text-text-tertiary " +
  "transition-colors duration-150 " +
  "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring focus:ring-offset-0";

export function RegistrationFilters({
  value,
  onChange,
  onReset,
}: RegistrationFiltersProps): React.ReactElement {
  const t = useTranslations("admin.registrations.filters");
  const tEnums = useTranslations("enums");

  const statusOptions = [
    { value: "", label: t("all") },
    { value: RegistrationStatus.CONFIRMED, label: t("confirmed") },
    { value: RegistrationStatus.CANCELLED, label: t("cancelled") },
  ];

  const stayOptions = [
    { value: "", label: t("anyStay") },
    ...Object.values(StayOption).map((s) => ({
      value: s,
      label: tEnums(`stay.${s}`),
    })),
  ];

  const accommodationOptions = [
    { value: "", label: t("anyAccommodation") },
    ...Object.values(AccommodationOption).map((a) => ({
      value: a,
      label: tEnums(`accommodation.${a}`),
    })),
  ];

  const patch = useCallback(
    (partial: Partial<RegistrationFiltersValue>): void => {
      onChange({ ...value, ...partial });
    },
    [value, onChange],
  );

  const hasActive =
    value.status !== "" ||
    value.stay !== "" ||
    value.accommodation !== "" ||
    value.search !== "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="relative sm:w-56">
          <SearchIcon />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            value={value.search}
            onChange={(e) => patch({ search: e.target.value })}
            className={`${CONTROL_BASE} px-3 py-2 pl-9 sm:w-full`}
          />
        </div>

        <SelectPill
          label={t("statusLabel")}
          value={value.status}
          options={statusOptions}
          onChange={(v) => patch({ status: v })}
        />
        <SelectPill
          label={t("stayLabel")}
          value={value.stay}
          options={stayOptions}
          onChange={(v) => patch({ stay: v })}
        />
        <SelectPill
          label={t("accommodationLabel")}
          value={value.accommodation}
          options={accommodationOptions}
          onChange={(v) => patch({ accommodation: v })}
        />

        {hasActive ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 self-start rounded-md px-3 py-2 text-xs font-medium text-text-tertiary transition-colors duration-150 hover:text-text-primary sm:self-auto"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t("clear")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SearchIcon(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
    </svg>
  );
}

interface Option {
  readonly value: string;
  readonly label: string;
}

function SelectPill({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: ReadonlyArray<Option>;
  readonly onChange: (value: string) => void;
}): React.ReactElement {
  return (
    <label
      className="relative inline-flex w-full cursor-pointer items-center gap-2 rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-sm text-text-secondary transition-colors duration-150 hover:border-border-strong hover:text-text-primary sm:w-auto"
    >
      <span className="sr-only">{label}</span>
      <span className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.08em] text-text-tertiary">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent pr-5 text-sm text-text-primary focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface-overlay">
            {opt.label}
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
    </label>
  );
}
