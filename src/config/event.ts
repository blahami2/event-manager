/**
 * Event-specific configuration constants.
 *
 * User-facing text (event name, date, location, description) is resolved
 * from i18n translation files (see src/i18n/messages/).
 *
 * This file only contains non-localizable configuration such as
 * calendar date objects used for ICS generation.
 */

import type { StayOption } from "@/types/registration";

/**
 * Event start/end dates mapped by guest stay option.
 *
 * Used to generate dynamic ICS calendar invites with correct
 * date ranges based on the guest's selected stay.
 */
export const EVENT_DATES_BY_STAY: Readonly<Record<StayOption, { readonly start: Date; readonly end: Date }>> = {
  FRI_SAT: { start: new Date("2026-06-05T20:00:00+02:00"), end: new Date("2026-06-06T20:00:00+02:00") },
  SAT_SUN: { start: new Date("2026-06-06T20:00:00+02:00"), end: new Date("2026-06-07T12:00:00+02:00") },
  FRI_SUN: { start: new Date("2026-06-05T20:00:00+02:00"), end: new Date("2026-06-07T12:00:00+02:00") },
};
