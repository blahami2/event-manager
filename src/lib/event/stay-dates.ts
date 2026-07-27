/**
 * Resolution of the calendar dates a registration's `.ics` invite carries.
 *
 * A registration always has a predefined `stay` option. Administrators may
 * additionally pin an arbitrary custom date range (issue #101), which takes
 * precedence over the stay option's predefined dates. The stay option is never
 * removed — it remains the value shown in tables, filters and exports — so
 * clearing the custom range restores the predefined behaviour exactly.
 *
 * @module stay-dates
 */

import {
  CUSTOM_RANGE_DAY_VISIT_END_TIME,
  CUSTOM_RANGE_DAY_VISIT_START_TIME,
  EVENT_DATES_BY_STAY,
  EVENT_TIMEZONE,
} from "@/config/event";
import { isIsoDate } from "@/lib/date/iso-date";
import {
  instantFromZonedDateTime,
  zonedIsoDate,
  zonedTimeOfDay,
} from "@/lib/date/timezone";
import { StayOption } from "@/types/registration";

/** A resolved event window as absolute instants. */
export interface EventDateRange {
  readonly start: Date;
  readonly end: Date;
}

/** The subset of a registration that determines its event window. */
export interface StayDatesSource {
  readonly stay: StayOption;
  readonly stayStartDate?: string | null;
  readonly stayEndDate?: string | null;
}

/**
 * Stay option used when a registration's own is not one of the known options.
 *
 * The day-visit option: the shortest, most conservative window, and the one
 * least likely to mislead if it is ever actually used.
 */
const FALLBACK_STAY: StayOption = StayOption.SAT_ONLY;

/**
 * The predefined window of a stay option, guarding the map lookup.
 *
 * `EVENT_DATES_BY_STAY[stay]` is an object index, so a key inherited from
 * `Object.prototype` — `"__proto__"`, `"constructor"`, `"toString"` — resolves
 * to something truthy that is not an event window. Its `.start` is `undefined`,
 * and formatting `undefined` as a date yields *the current time*, so the invite
 * silently took its times of day from the wall clock. Any other unknown key
 * threw instead. A Postgres enum column makes both unreachable today; this
 * makes the fallback defined rather than accidental, on a code path that runs
 * after the guest's token has been rotated.
 */
function predefinedDates(stay: StayOption): EventDateRange {
  return Object.hasOwn(EVENT_DATES_BY_STAY, stay)
    ? EVENT_DATES_BY_STAY[stay]
    : EVENT_DATES_BY_STAY[FALLBACK_STAY];
}

/**
 * The venue-local times of day a stay option arrives and departs at.
 *
 * Derived from the predefined instants rather than duplicated as constants, so
 * the two can never drift apart. This is what makes a custom range *lossless*
 * when it happens to equal the stay option's own dates: an admin who ticks
 * "custom date range" (which prefills from the stay option) and saves without
 * changing anything produces exactly the invite they started with.
 */
function stayTimesOfDay(stay: StayOption): { readonly arrival: string; readonly departure: string } {
  const predefined = predefinedDates(stay);
  return {
    arrival: zonedTimeOfDay(EVENT_TIMEZONE, predefined.start),
    departure: zonedTimeOfDay(EVENT_TIMEZONE, predefined.end),
  };
}

/**
 * Convert a venue-local date and time to an instant, or `null` if it cannot be
 * represented.
 */
function toInstant(isoDate: string, time: string): Date | null {
  return instantFromZonedDateTime(EVENT_TIMEZONE, isoDate, time);
}

/**
 * Resolve the event window for a registration.
 *
 * **Total: no input can make this throw, and no output depends on the current
 * time.** It is called from inside the outgoing-email path, after the guest's
 * capability token has been rotated, so anything it cannot resolve must degrade
 * to a usable window rather than propagate. Every failure mode — absent,
 * partial, malformed, a range outside the window the venue's time zone can be
 * read for (see `SUPPORTED_STAY_DATE_MIN`/`_MAX`), or a `stay` outside the enum
 * (see {@link predefinedDates}) — falls back to a predefined window. Stored
 * ranges are bounds-checked on the way in; this is the backstop for rows that
 * predate a bounds change or arrive by any future path that skips validation.
 *
 * Times of day come from the stay option (see {@link stayTimesOfDay}). When
 * those would produce an empty or inverted window — an overnight option's
 * 20:00 → 12:00 applied to a single date — the range is treated as a day visit
 * and uses the day-visit times instead.
 */
export function resolveEventDates(source: StayDatesSource): EventDateRange {
  const { stay, stayStartDate, stayEndDate } = source;
  const predefined = predefinedDates(stay);

  if (
    typeof stayStartDate !== "string" ||
    typeof stayEndDate !== "string" ||
    !isIsoDate(stayStartDate) ||
    !isIsoDate(stayEndDate)
  ) {
    return predefined;
  }

  const { arrival, departure } = stayTimesOfDay(stay);
  const start = toInstant(stayStartDate, arrival);
  const end = toInstant(stayEndDate, departure);

  if (start && end && end.getTime() > start.getTime()) {
    return { start, end };
  }

  const dayVisitStart = toInstant(stayStartDate, CUSTOM_RANGE_DAY_VISIT_START_TIME);
  const dayVisitEnd = toInstant(stayEndDate, CUSTOM_RANGE_DAY_VISIT_END_TIME);

  if (dayVisitStart && dayVisitEnd && dayVisitEnd.getTime() > dayVisitStart.getTime()) {
    return { start: dayVisitStart, end: dayVisitEnd };
  }

  return predefined;
}

/**
 * The calendar dates implied by a predefined stay option, in venue-local time.
 *
 * Used to prefill the admin custom-range inputs, so switching a registration to
 * a custom range starts from the dates it already had rather than from blank
 * fields. Round-trips losslessly through {@link resolveEventDates} for every
 * stay option.
 */
export function defaultDateRangeForStay(stay: StayOption): {
  readonly start: string;
  readonly end: string;
} {
  const predefined = EVENT_DATES_BY_STAY[stay];
  return {
    start: zonedIsoDate(EVENT_TIMEZONE, predefined.start),
    end: zonedIsoDate(EVENT_TIMEZONE, predefined.end),
  };
}
