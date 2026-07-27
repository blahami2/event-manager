import { describe, it, expect } from "vitest";

import {
  formatIsoDate,
  isIsoDate,
  parseIsoDate,
} from "@/lib/date/iso-date";

/**
 * Calendar dates (`YYYY-MM-DD`) are the wire format for admin-set custom stay
 * ranges. They must round-trip without timezone drift, which is why parsing
 * anchors to UTC midnight and formatting reads UTC components.
 */
describe("parseIsoDate", () => {
  it("should return a UTC-midnight Date when given a well-formed calendar date", () => {
    // given
    // - a well-formed ISO calendar date
    const value = "2026-06-05";

    // when
    const result = parseIsoDate(value);

    // then
    expect(result?.toISOString()).toBe("2026-06-05T00:00:00.000Z");
  });

  it("should return a UTC-midnight Date when given a valid leap day", () => {
    // given
    // - 2028 is a leap year, so 29 February exists
    const value = "2028-02-29";

    // when
    const result = parseIsoDate(value);

    // then
    expect(result?.toISOString()).toBe("2028-02-29T00:00:00.000Z");
  });

  it.each([
    ["a non-leap-year 29 February", "2027-02-29"],
    ["a 31st in a 30-day month", "2026-04-31"],
    ["a month above 12", "2026-13-01"],
    ["a zero month", "2026-00-10"],
    ["a zero day", "2026-06-00"],
  ])("should return null when given %s", (_label, value) => {
    // when
    const result = parseIsoDate(value);

    // then
    expect(result).toBeNull();
  });

  it.each([
    ["an empty string", ""],
    ["free text", "not-a-date"],
    ["a datetime instead of a date", "2026-06-05T20:00:00Z"],
    ["a non-padded month", "2026-6-05"],
    ["a slash-separated date", "2026/06/05"],
    ["trailing whitespace", "2026-06-05 "],
  ])("should return null when given %s", (_label, value) => {
    // when
    const result = parseIsoDate(value);

    // then
    expect(result).toBeNull();
  });
});

describe("isIsoDate", () => {
  it("should return true when the value is a real calendar date", () => {
    expect(isIsoDate("2026-06-07")).toBe(true);
  });

  it("should return false when the value is syntactically valid but not a real date", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
  });

  it("should return false when the value is malformed", () => {
    expect(isIsoDate("06-07-2026")).toBe(false);
  });
});

describe("formatIsoDate", () => {
  it("should render the UTC calendar date when given an instant", () => {
    // given
    // - an instant late in the UTC day
    const date = new Date("2026-06-05T23:59:59.000Z");

    // when
    const result = formatIsoDate(date);

    // then
    expect(result).toBe("2026-06-05");
  });

  it("should zero-pad single-digit months and days", () => {
    // given
    const date = new Date("2026-01-02T00:00:00.000Z");

    // when
    const result = formatIsoDate(date);

    // then
    expect(result).toBe("2026-01-02");
  });

  it("should round-trip a parsed date back to the same string", () => {
    // given
    const original = "2026-11-30";

    // when
    const parsed = parseIsoDate(original);
    const result = parsed ? formatIsoDate(parsed) : null;

    // then
    expect(result).toBe(original);
  });
});
