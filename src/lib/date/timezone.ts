/**
 * IANA-timezone conversions between venue-local wall time and absolute instants.
 *
 * Admin-set custom stay ranges capture calendar dates only, so turning them
 * into calendar-invite instants means picking a time of day *in the venue's
 * local time*. The venue observes daylight saving, and ranges may be set
 * anywhere in the calendar, so a fixed UTC offset would be an hour wrong for
 * roughly half the year. Every conversion here therefore resolves the offset in
 * force on the instant being converted.
 *
 * Implemented with `Intl` rather than a date library: no dependency, and the
 * tz database ships with the runtime.
 *
 * **Every conversion here is total**: it reports failure as `null` instead of
 * throwing. These functions run inside the outgoing-email path, downstream of
 * capability-token rotation, so an exception would cost a guest their only
 * working manage link. `null` lets the caller fall back; a throw cannot be
 * recovered from at that point.
 *
 * @module timezone
 */

import { parseIsoDate } from "@/lib/date/iso-date";

/** Strict `HH:MM:SS` shape, 24-hour, zero-padded, captured as three parts. */
const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

/** Milliseconds in one day — the span a `HH:MM:SS` time of day offsets into. */
const MS_PER_SECOND = 1_000;

/**
 * `GMT`, `GMT+02:00`, `GMT-05:30` — the `longOffset` time-zone name format.
 *
 * The seconds group matches the pre-standard-time local mean time offsets the
 * tz database still carries (`Europe/Bratislava` is `GMT+00:57:44` before
 * 1891). Matching them is what turns "unparseable, throw" into "recognized,
 * report as unrepresentable" — see {@link zoneOffsetMinutes}.
 */
const GMT_OFFSET_PATTERN = /^GMT(?:([+-])(\d{2}):(\d{2})(?::(\d{2}))?)?$/;

/** Cache formatters: constructing `Intl.DateTimeFormat` is comparatively costly. */
const offsetFormatters = new Map<string, Intl.DateTimeFormat>();
const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function offsetFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = offsetFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" });
    offsetFormatters.set(timeZone, formatter);
  }
  return formatter;
}

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = partsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partsFormatters.set(timeZone, formatter);
  }
  return formatter;
}

/** Read one formatted field, defaulting to `"00"` if the runtime omits it. */
function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((p) => p.type === type)?.value ?? "00";
}

/**
 * Minutes to add to UTC to reach local time in `timeZone` at `instant`, or
 * `null` when no whole-minute offset applies.
 *
 * Positive east of Greenwich (`Europe/Bratislava` in summer → `120`), negative
 * west of it (`America/New_York` in winter → `-300`).
 *
 * `null` means one of three things, all of which the caller must handle rather
 * than propagate: the zone identifier is not one the runtime knows, the instant
 * is not a real date, or the zone was on local mean time at that instant and its
 * offset carries a seconds component. The last case is not roundable — a stay
 * range converted with a 57-minute-44-second offset silently misstates the
 * guest's arrival — so it is refused, not approximated.
 */
export function zoneOffsetMinutes(timeZone: string, instant: Date): number | null {
  if (!Number.isFinite(instant.getTime())) {
    return null;
  }

  let name: string | undefined;
  try {
    name = offsetFormatter(timeZone)
      .formatToParts(instant)
      .find((p) => p.type === "timeZoneName")?.value;
  } catch {
    // An unknown time-zone identifier makes `Intl.DateTimeFormat` throw a
    // RangeError. That is a caller error, but not one worth an exception on
    // the email path.
    return null;
  }

  const match = name ? GMT_OFFSET_PATTERN.exec(name) : null;
  if (!match) {
    return null;
  }

  const [, sign, hours, minutes, seconds] = match;
  // A bare "GMT" (no offset component) means the zone is exactly on UTC.
  if (!sign || !hours || !minutes) {
    return 0;
  }

  // A sub-minute component means local mean time, which predates the modern
  // offset grid this module assumes.
  if (seconds !== undefined && seconds !== "00") {
    return null;
  }

  const magnitude = Number(hours) * 60 + Number(minutes);
  return sign === "-" ? -magnitude : magnitude;
}

/**
 * Build the instant at which a wall-clock date and time occur in `timeZone`,
 * or `null` when that instant cannot be determined.
 *
 * @param isoDate - Local calendar date as `YYYY-MM-DD`.
 * @param time    - Local time of day as `HH:MM:SS`.
 *
 * Resolved in two passes: the first guesses using the offset at the naive UTC
 * instant, the second re-reads the offset at that guess. This is what makes
 * times on a DST-transition day land correctly — the offset before the
 * transition differs from the one after it, and only the second pass sees the
 * right side of it.
 *
 * Returns `null` for a malformed date or time, an unknown zone, or a date whose
 * offset {@link zoneOffsetMinutes} cannot express (see its documentation).
 */
export function instantFromZonedDateTime(
  timeZone: string,
  isoDate: string,
  time: string,
): Date | null {
  // Built from validated components rather than by parsing
  // `${isoDate}T${time}Z`: that string form silently rolls a non-existent date
  // over ("2026-02-30" becomes 2 March) and would put a plausible but wrong
  // date in the guest's calendar.
  const day = parseIsoDate(isoDate);
  const timeParts = TIME_OF_DAY_PATTERN.exec(time);
  if (!day || !timeParts) {
    return null;
  }

  const [, hours, minutes, seconds] = timeParts;
  const secondsIntoDay =
    Number(hours) * 3_600 + Number(minutes) * 60 + Number(seconds);

  const naiveUtc = new Date(day.getTime() + secondsIntoDay * MS_PER_SECOND);
  if (!Number.isFinite(naiveUtc.getTime())) {
    return null;
  }

  const naiveOffset = zoneOffsetMinutes(timeZone, naiveUtc);
  if (naiveOffset === null) {
    return null;
  }

  const firstGuess = new Date(naiveUtc.getTime() - naiveOffset * 60_000);
  const resolvedOffset = zoneOffsetMinutes(timeZone, firstGuess);
  if (resolvedOffset === null) {
    return null;
  }

  const instant = new Date(naiveUtc.getTime() - resolvedOffset * 60_000);
  return Number.isFinite(instant.getTime()) ? instant : null;
}

/** The local calendar date (`YYYY-MM-DD`) on which `instant` falls in `timeZone`. */
export function zonedIsoDate(timeZone: string, instant: Date): string {
  const parts = partsFormatter(timeZone).formatToParts(instant);
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

/** The local wall-clock time (`HH:MM:SS`) of `instant` in `timeZone`. */
export function zonedTimeOfDay(timeZone: string, instant: Date): string {
  const parts = partsFormatter(timeZone).formatToParts(instant);
  // `hourCycle: "h23"` should keep midnight at 00, but some ICU builds still
  // emit 24 for it; normalize so the value is always a valid time of day.
  const hour = part(parts, "hour") === "24" ? "00" : part(parts, "hour");
  return `${hour}:${part(parts, "minute")}:${part(parts, "second")}`;
}
