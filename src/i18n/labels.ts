/**
 * Canonical display labels for domain enum values.
 *
 * Every admin and public surface MUST use these helpers when rendering an
 * `AccommodationOption`, `StayOption`, or `RegistrationStatus`. This is the
 * single source of truth for enum display labels and keeps the three locale
 * files in lockstep.
 *
 * Background: before this module existed, accommodation and stay labels were
 * duplicated across `form.*`, `admin.registrations.edit.*`, `admin.registrations.add.*`,
 * and a hardcoded `formatAccommodation`/`formatStay` function in the admin
 * table. Those four sources drifted — same enum value, four different display
 * strings. Routing every label through this module makes drift impossible.
 *
 * Keys are namespaced as `enums.<category>.<ENUM_VALUE>`. The enum value is
 * used verbatim so the key is trivially discoverable from the enum itself.
 */
import {
  AccommodationOption,
  RegistrationStatus,
  StayOption,
} from "@/types/registration";

/** Signature a translator must satisfy. Compatible with `useTranslations()`. */
export type Translator = (key: string) => string;

// ---------------------------------------------------------------------------
// Key computation — pure string helpers.
// Separated from `*Label` so they can be tested without a translator.
// ---------------------------------------------------------------------------

/** Translation key for a given accommodation option. */
export function accommodationEnumKey(option: AccommodationOption): string {
  return `enums.accommodation.${option}`;
}

/** Translation key for a given stay option. */
export function stayEnumKey(option: StayOption): string {
  return `enums.stay.${option}`;
}

/** Translation key for a given registration status. */
export function statusEnumKey(status: RegistrationStatus): string {
  return `enums.status.${status}`;
}

// ---------------------------------------------------------------------------
// Label resolution — applies a translator to the canonical key.
// ---------------------------------------------------------------------------

/** Resolve the localized display label for an accommodation option. */
export function accommodationLabel(
  option: AccommodationOption,
  t: Translator,
): string {
  return t(accommodationEnumKey(option));
}

/** Resolve the localized display label for a stay option. */
export function stayLabel(option: StayOption, t: Translator): string {
  return t(stayEnumKey(option));
}

/**
 * Resolve the stay label used by registration summaries.
 *
 * A persisted stay option remains useful for editing and filtering when an
 * admin overrides its dates, but it no longer describes the actual stay.
 */
export function staySummaryLabel(
  option: StayOption,
  stayStartDate: string | null,
  stayEndDate: string | null,
  t: Translator,
): string {
  return stayStartDate && stayEndDate
    ? t("enums.stay.CUSTOM")
    : stayLabel(option, t);
}

/** Resolve the localized display label for a registration status. */
export function statusLabel(
  status: RegistrationStatus,
  t: Translator,
): string {
  return t(statusEnumKey(status));
}

// ---------------------------------------------------------------------------
// Ordered option lists — convenient for populating <select> dropdowns.
// ---------------------------------------------------------------------------

/** Accommodation options in the order they should appear in selects. */
export const ACCOMMODATION_OPTIONS: ReadonlyArray<AccommodationOption> = [
  AccommodationOption.ANYWHERE,
  AccommodationOption.PRIVATE_ROOM,
  AccommodationOption.COMMON_ROOM,
  AccommodationOption.OWN_TENT,
  AccommodationOption.NONE,
] as const;

/** Stay options currently offered in new registrations. */
export const CURRENT_STAY_OPTIONS: ReadonlyArray<StayOption> = [
  StayOption.SAT_SUN,
  StayOption.SAT_ONLY,
] as const;

/** Legacy stay options kept only for display of pre-existing registrations. */
export const LEGACY_STAY_OPTIONS: ReadonlyArray<StayOption> = [
  StayOption.FRI_SAT,
  StayOption.FRI_SUN,
] as const;

/**
 * All stay options, in weekend-chronological display order.
 *
 * Admin surfaces (Add / Edit registration modals) render this full list so
 * an admin can enter or correct a registration to any stay value, including
 * the legacy options no longer sold on the public form. The public
 * `RegistrationForm` must keep using `CURRENT_STAY_OPTIONS` instead.
 */
export const ALL_STAY_OPTIONS: ReadonlyArray<StayOption> = [
  StayOption.FRI_SAT,
  StayOption.SAT_SUN,
  StayOption.FRI_SUN,
  StayOption.SAT_ONLY,
] as const;
