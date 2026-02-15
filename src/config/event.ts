/**
 * Event-specific configuration constants.
 *
 * These values are displayed on the public landing page (T-021)
 * and included in email templates (T-020).
 *
 * Update these values to customise the event.
 */
// TODO verify usage - should be localized everywhere

import type { StayOption } from "@/types/registration";

/** Display name of the event. */
export const EVENT_NAME = "Triple Threat";

/** Human-readable event date string. */
export const EVENT_DATE = "Saturday, March 28, 2026";

/** Event venue / address. */
export const EVENT_LOCATION = "123 Party Lane, Prague, Czech Republic";

/** Short description shown on the landing page. */
export const EVENT_DESCRIPTION =
  "Join us for an unforgettable birthday celebration! Great food, music, and company await.";

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
