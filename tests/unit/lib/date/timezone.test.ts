import { describe, it, expect } from "vitest";

import {
  instantFromZonedDateTime,
  zoneOffsetMinutes,
  zonedIsoDate,
  zonedTimeOfDay,
} from "@/lib/date/timezone";

const PRAGUE = "Europe/Bratislava";

/**
 * The venue's local time observes daylight saving. Custom stay ranges may be
 * set anywhere in the calendar, so converting between venue-local wall time and
 * absolute instants must use the offset in force *on that date*, not a fixed
 * one.
 */
describe("zoneOffsetMinutes", () => {
  it("should report the summer offset for a date in daylight saving time", () => {
    // given
    const instant = new Date("2026-06-06T12:00:00.000Z");

    // when
    const result = zoneOffsetMinutes(PRAGUE, instant);

    // then
    expect(result).toBe(120);
  });

  it("should report the winter offset for a date in standard time", () => {
    // given
    const instant = new Date("2026-01-06T12:00:00.000Z");

    // when
    const result = zoneOffsetMinutes(PRAGUE, instant);

    // then
    expect(result).toBe(60);
  });

  it("should report a zero offset for UTC", () => {
    expect(zoneOffsetMinutes("UTC", new Date("2026-06-06T12:00:00.000Z"))).toBe(0);
  });

  it("should report a negative offset for a zone behind UTC", () => {
    expect(zoneOffsetMinutes("America/New_York", new Date("2026-01-06T12:00:00.000Z"))).toBe(-300);
  });

  it("should report a half-hour offset for a zone that uses one", () => {
    expect(zoneOffsetMinutes("Asia/Kolkata", new Date("2026-06-06T12:00:00.000Z"))).toBe(330);
  });

  /**
   * Before standard time was adopted, zones ran on local mean time, whose offset
   * is not a whole number of minutes: the tz database gives `Europe/Bratislava`
   * `GMT+00:57:44` for any instant before 1891. An offset parser that assumes
   * `GMT±HH:MM` cannot read that, and the conversion sits behind every outgoing
   * calendar invite — so it must degrade, never throw.
   */
  it("should return null rather than throw for a pre-standard-time local mean time offset", () => {
    // given
    const instant = new Date("1850-01-01T12:00:00.000Z");

    // when
    const result = zoneOffsetMinutes(PRAGUE, instant);

    // then
    expect(result).toBeNull();
  });

  it("should return null rather than throw for an unresolvable time zone", () => {
    expect(zoneOffsetMinutes("Not/AZone", new Date("2026-06-06T12:00:00.000Z"))).toBeNull();
  });

  it("should return null rather than throw for an invalid instant", () => {
    expect(zoneOffsetMinutes(PRAGUE, new Date("nonsense"))).toBeNull();
  });
});

describe("instantFromZonedDateTime", () => {
  it("should apply the summer offset for a local time in daylight saving time", () => {
    // given
    // - 20:00 local on a June evening is 18:00 UTC
    const result = instantFromZonedDateTime(PRAGUE, "2026-06-05", "20:00:00");

    // then
    expect(result?.toISOString()).toBe("2026-06-05T18:00:00.000Z");
  });

  it("should apply the winter offset for a local time in standard time", () => {
    // given
    // - the same wall-clock time in January is 19:00 UTC
    const result = instantFromZonedDateTime(PRAGUE, "2026-01-05", "20:00:00");

    // then
    expect(result?.toISOString()).toBe("2026-01-05T19:00:00.000Z");
  });

  it("should apply the standard offset on the morning of the spring-forward day", () => {
    // given
    // - DST starts 2026-03-29 at 02:00 local; 01:00 is still standard time
    const result = instantFromZonedDateTime(PRAGUE, "2026-03-29", "01:00:00");

    // then
    expect(result?.toISOString()).toBe("2026-03-29T00:00:00.000Z");
  });

  it("should apply the summer offset in the evening of the spring-forward day", () => {
    // given
    // - after the transition the same day is on the summer offset
    const result = instantFromZonedDateTime(PRAGUE, "2026-03-29", "20:00:00");

    // then
    expect(result?.toISOString()).toBe("2026-03-29T18:00:00.000Z");
  });

  it("should round-trip a local date and time back through the zoned accessors", () => {
    // given
    const isoDate = "2026-11-30";
    const time = "12:00:00";

    // when
    const instant = instantFromZonedDateTime(PRAGUE, isoDate, time);

    // then
    expect(instant).not.toBeNull();
    expect(zonedIsoDate(PRAGUE, instant as Date)).toBe(isoDate);
    expect(zonedTimeOfDay(PRAGUE, instant as Date)).toBe(time);
  });
});

/**
 * `instantFromZonedDateTime` reports failure as `null` rather than throwing:
 * it sits behind every outgoing calendar invite, on a path that has already
 * rotated the guest's capability token by the time it runs. A `null` lets the
 * caller fall back to predefined dates; an exception would cost the guest their
 * only working manage link.
 */
describe("instantFromZonedDateTime totality", () => {
  it("should return null for a date whose offset cannot be expressed in whole minutes", () => {
    expect(instantFromZonedDateTime(PRAGUE, "1850-01-01", "20:00:00")).toBeNull();
  });

  it("should return null for a malformed calendar date", () => {
    expect(instantFromZonedDateTime(PRAGUE, "2026-02-30", "20:00:00")).toBeNull();
  });

  it("should return null for a malformed time of day", () => {
    expect(instantFromZonedDateTime(PRAGUE, "2026-06-05", "not-a-time")).toBeNull();
  });

  it("should return null for an unresolvable time zone", () => {
    expect(instantFromZonedDateTime("Not/AZone", "2026-06-05", "20:00:00")).toBeNull();
  });
});

describe("zonedIsoDate", () => {
  it("should return the local calendar date when UTC is already on the previous day", () => {
    // given
    // - 22:30 UTC on 5 June is 00:30 local on 6 June
    const instant = new Date("2026-06-05T22:30:00.000Z");

    // when
    const result = zonedIsoDate(PRAGUE, instant);

    // then
    expect(result).toBe("2026-06-06");
  });

  it("should return the UTC calendar date when the zone is UTC", () => {
    expect(zonedIsoDate("UTC", new Date("2026-06-05T22:30:00.000Z"))).toBe("2026-06-05");
  });
});

describe("zonedTimeOfDay", () => {
  it("should return the local wall-clock time of an instant", () => {
    // given
    const instant = new Date("2026-06-05T18:00:00.000Z");

    // when
    const result = zonedTimeOfDay(PRAGUE, instant);

    // then
    expect(result).toBe("20:00:00");
  });

  it("should render local midnight as 00:00:00 rather than 24:00:00", () => {
    // given
    // - 22:00 UTC is midnight local; some Intl outputs render this as hour 24
    const instant = new Date("2026-06-05T22:00:00.000Z");

    // when
    const result = zonedTimeOfDay(PRAGUE, instant);

    // then
    expect(result).toBe("00:00:00");
  });
});
