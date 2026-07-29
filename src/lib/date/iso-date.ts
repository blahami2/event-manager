/**
 * Calendar-date (`YYYY-MM-DD`) helpers.
 *
 * Admin-set custom stay ranges are *calendar dates*, not instants: "arrive on
 * 10 July" means the same thing regardless of the reader's timezone. They
 * therefore travel across every layer as `YYYY-MM-DD` strings and are anchored
 * to UTC midnight when a `Date` object is unavoidable (Prisma, ICS maths).
 * Parsing via `new Date("2026-07-10")` would already yield UTC midnight, but it
 * also silently accepts inputs like `"2026-13-01"` shapes and datetimes, so
 * every value is validated explicitly before it is trusted.
 *
 * @module iso-date
 */

/** Strict `YYYY-MM-DD` shape. Deliberately rejects datetimes and unpadded parts. */
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a strict `YYYY-MM-DD` calendar date into a UTC-midnight `Date`.
 *
 * Returns `null` for anything that is not a real calendar date — malformed
 * input, an out-of-range month or day, or a day that does not exist in the
 * given month (e.g. `2027-02-29`).
 */
export function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) {
    return null;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  const parsed = new Date(Date.UTC(year, month - 1, day));

  // Date.UTC rolls overflowing components over (31 April becomes 1 May), so
  // compare the round-trip back to the requested components to reject them.
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

/** Whether a string is a real calendar date in strict `YYYY-MM-DD` form. */
export function isIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null;
}

/** Render the UTC calendar date of an instant as `YYYY-MM-DD`. */
export function formatIsoDate(date: Date): string {
  const pad = (n: number): string => n.toString().padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}
