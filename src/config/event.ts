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
 * Registration deadline.
 *
 * After this date, the public registration form and manage form
 * are disabled and guests are directed to contact administrators.
 */
export const REGISTRATION_DEADLINE = new Date("2026-04-19T23:59:59+02:00");

/**
 * Event start/end dates mapped by guest stay option.
 *
 * Used to generate dynamic ICS calendar invites with correct
 * date ranges based on the guest's selected stay.
 */
/**
 * IANA time zone of the venue (Modra, Slovakia).
 *
 * Admin-set custom date ranges capture calendar dates only, so their calendar
 * invites need a time of day in venue-local terms. A fixed UTC offset would be
 * an hour wrong for any range outside daylight saving time, and arbitrary
 * ranges are explicitly allowed anywhere in the calendar — hence a zone, not an
 * offset.
 */
export const EVENT_TIMEZONE = "Europe/Bratislava";

/**
 * Inclusive calendar bounds for an admin-set custom stay range.
 *
 * Administrators are deliberately not limited to the event weekend, but "any
 * date at all" is not free: the range is converted to venue-local instants for
 * every calendar invite, and outside this window that conversion has no
 * faithful answer. Before 1891 `Europe/Bratislava` ran on local mean time —
 * `GMT+00:57:44` — an offset no whole-minute arithmetic can represent, and the
 * far future is a projection of the current DST rules rather than a fact.
 *
 * The window is therefore the range the whole system can represent honestly:
 * every date in it has a whole-minute UTC offset in the tz database and is
 * comfortably inside the `Date` range. It is wide enough to cover any real
 * booking, historical record keeping, and a multi-decade forward horizon, and
 * it is mirrored in the admin form's date inputs so the boundary is visible
 * before submission rather than only in a rejection.
 */
export const SUPPORTED_STAY_DATE_MIN = "2000-01-01";
export const SUPPORTED_STAY_DATE_MAX = "2100-12-31";

/**
 * Local start/end times for a custom range that begins and ends on one day.
 *
 * Multi-day custom ranges reuse the times of day of the registration's stay
 * option, but a single-day range cannot: an overnight option's 20:00 → 12:00
 * would invert on one date. Day visits therefore use these times, which match
 * the predefined `SAT_ONLY` day-visit window.
 */
export const CUSTOM_RANGE_DAY_VISIT_START_TIME = "14:00:00";
export const CUSTOM_RANGE_DAY_VISIT_END_TIME = "22:00:00";

export const EVENT_DATES_BY_STAY: Readonly<Record<StayOption, { readonly start: Date; readonly end: Date }>> = {
  FRI_SAT: { start: new Date("2026-06-05T20:00:00+02:00"), end: new Date("2026-06-06T20:00:00+02:00") },
  SAT_SUN: { start: new Date("2026-06-06T20:00:00+02:00"), end: new Date("2026-06-07T12:00:00+02:00") },
  FRI_SUN: { start: new Date("2026-06-05T20:00:00+02:00"), end: new Date("2026-06-07T12:00:00+02:00") },
  SAT_ONLY: { start: new Date("2026-06-06T14:00:00+02:00"), end: new Date("2026-06-06T22:00:00+02:00") },
};
