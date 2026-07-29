import { describe, it, expect, vi } from "vitest";

import { defaultDateRangeForStay, resolveEventDates } from "@/lib/event/stay-dates";
import {
  EVENT_DATES_BY_STAY,
  SUPPORTED_STAY_DATE_MAX,
  SUPPORTED_STAY_DATE_MIN,
} from "@/config/event";
import { StayOption } from "@/types/registration";

/**
 * `resolveEventDates` is the single place that decides which calendar dates a
 * registration's .ics invite carries: an admin-set custom range when present,
 * the predefined stay-option mapping otherwise.
 */
describe("resolveEventDates", () => {
  it("should use the predefined stay dates when no custom range is set", () => {
    // given
    const registration = { stay: StayOption.SAT_SUN, stayStartDate: null, stayEndDate: null };

    // when
    const result = resolveEventDates(registration);

    // then
    expect(result).toEqual(EVENT_DATES_BY_STAY[StayOption.SAT_SUN]);
  });

  it("should use the predefined stay dates when the range fields are omitted", () => {
    // given
    // - public registrations never carry a custom range
    const registration = { stay: StayOption.SAT_ONLY };

    // when
    const result = resolveEventDates(registration);

    // then
    expect(result).toEqual(EVENT_DATES_BY_STAY[StayOption.SAT_ONLY]);
  });

  it("should use the custom range with event arrival and departure times when it spans multiple days", () => {
    // given
    // - an arbitrary range that has no predefined stay-option equivalent
    const registration = {
      stay: StayOption.SAT_SUN,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-13",
    };

    // when
    const result = resolveEventDates(registration);

    // then
    // - arrival 20:00 and departure 12:00 in the event timezone (+02:00)
    expect(result.start.toISOString()).toBe("2026-07-10T18:00:00.000Z");
    expect(result.end.toISOString()).toBe("2026-07-13T10:00:00.000Z");
  });

  it("should take the times of day from the stay option rather than a fixed pair", () => {
    // given
    // - FRI_SAT is an overnight-to-evening stay: 20:00 to 20:00 local, unlike
    //   SAT_SUN's 20:00 to 12:00
    const registration = {
      stay: StayOption.FRI_SAT,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-13",
    };

    // when
    const result = resolveEventDates(registration);

    // then
    expect(result.start.toISOString()).toBe("2026-07-10T18:00:00.000Z");
    expect(result.end.toISOString()).toBe("2026-07-13T18:00:00.000Z");
  });

  it("should use the venue's winter offset for a range outside daylight saving time", () => {
    // given
    // - arbitrary ranges may fall in winter, when the venue is on UTC+1
    const registration = {
      stay: StayOption.SAT_SUN,
      stayStartDate: "2026-01-10",
      stayEndDate: "2026-01-13",
    };

    // when
    const result = resolveEventDates(registration);

    // then
    // - 20:00 and 12:00 local are 19:00 and 11:00 UTC in winter
    expect(result.start.toISOString()).toBe("2026-01-10T19:00:00.000Z");
    expect(result.end.toISOString()).toBe("2026-01-13T11:00:00.000Z");
  });

  it("should use day-visit times when the custom range starts and ends on the same date", () => {
    // given
    // - a same-day range would otherwise produce an end before its start
    const registration = {
      stay: StayOption.SAT_SUN,
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-10",
    };

    // when
    const result = resolveEventDates(registration);

    // then
    // - 14:00 to 22:00 in the event timezone (+02:00)
    expect(result.start.toISOString()).toBe("2026-07-10T12:00:00.000Z");
    expect(result.end.toISOString()).toBe("2026-07-10T20:00:00.000Z");
    expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
  });

  it("should fall back to the predefined stay dates when only one custom date is set", () => {
    // given
    // - an incomplete range is never persisted, but the resolver must not
    //   produce a half-defined invite if it ever sees one
    const registration = {
      stay: StayOption.FRI_SUN,
      stayStartDate: "2026-07-10",
      stayEndDate: null,
    };

    // when
    const result = resolveEventDates(registration);

    // then
    expect(result).toEqual(EVENT_DATES_BY_STAY[StayOption.FRI_SUN]);
  });

  it("should fall back to the predefined stay dates when a custom date is malformed", () => {
    // given
    const registration = {
      stay: StayOption.FRI_SAT,
      stayStartDate: "not-a-date",
      stayEndDate: "2026-07-13",
    };

    // when
    const result = resolveEventDates(registration);

    // then
    expect(result).toEqual(EVENT_DATES_BY_STAY[StayOption.FRI_SAT]);
  });
});

/**
 * `resolveEventDates` runs inside every outgoing manage-link email, after the
 * guest's capability token has been rotated. A throw there costs the guest their
 * only working link, so the resolver must be **total**: every input, however
 * absurd, yields a usable window instead of an exception.
 *
 * Stored ranges are bounded by `stayDateRangeSchema`, but rows predating a
 * bounds change — or written by any future path that skips validation — must
 * still resolve.
 */
describe("resolveEventDates totality", () => {
  it.each([
    ["a date before the venue's zone used a whole-minute offset", "1850-01-01", "1850-01-05"],
    ["a date at the lower edge of the parsable calendar", "0100-01-01", "0100-01-05"],
    ["a date far beyond any plausible booking", "9999-12-25", "9999-12-31"],
  ])("should resolve a window without throwing for %s", (_case, start, end) => {
    // given
    // - a stored range outside the supported window
    const registration = {
      stay: StayOption.SAT_SUN,
      stayStartDate: start,
      stayEndDate: end,
    };

    // when
    const result = resolveEventDates(registration);

    // then
    // - a usable, ordered window is produced rather than an exception
    expect(Number.isFinite(result.start.getTime())).toBe(true);
    expect(Number.isFinite(result.end.getTime())).toBe(true);
    expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
  });

  it("should fall back to the predefined stay dates when a range is outside the supported window", () => {
    // given
    // - the venue's zone reports a sub-minute LMT offset for 1850, which no
    //   whole-minute conversion can represent faithfully
    const registration = {
      stay: StayOption.FRI_SUN,
      stayStartDate: "1850-01-01",
      stayEndDate: "1850-01-05",
    };

    // when
    const result = resolveEventDates(registration);

    // then
    expect(result).toEqual(EVENT_DATES_BY_STAY[StayOption.FRI_SUN]);
  });

  /**
   * `EVENT_DATES_BY_STAY[stay]` is an object index, so keys inherited from
   * `Object.prototype` resolve to something truthy that is not an event window:
   * `EVENT_DATES_BY_STAY["__proto__"]` yields `Object.prototype`, whose `.start`
   * is `undefined`, and formatting `undefined` as a date yields *the current
   * time*. The result was a plausible-looking window derived from the wall
   * clock — a silently wrong invite rather than a detectable failure. A key
   * outside the enum that is not on the prototype threw instead.
   *
   * A Postgres enum column makes both unreachable today; the point is that the
   * fallback is defined rather than accidental, since this runs after token
   * rotation.
   */
  it.each([["__proto__"], ["constructor"], ["toString"], ["valueOf"], ["SUN_ONLY"], [""]])(
    "should resolve a defined window for the out-of-enum stay value %j",
    (stay) => {
      // given
      const registration = {
        stay: stay as StayOption,
        stayStartDate: "2026-07-10",
        stayEndDate: "2026-07-12",
      };

      // when
      const result = resolveEventDates(registration);

      // then
      expect(result).toBeDefined();
      expect(Number.isFinite(result.start.getTime())).toBe(true);
      expect(Number.isFinite(result.end.getTime())).toBe(true);
      expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
    },
  );

  it.each([["__proto__"], ["constructor"], ["toString"], ["valueOf"], ["SUN_ONLY"]])(
    "should resolve a window independent of the current time for the stay value %j",
    (stay) => {
      // given
      // - the defect's signature: the window's time of day came from the wall
      //   clock, so the same registration resolved differently minute to minute
      const registration = {
        stay: stay as StayOption,
        stayStartDate: "2026-07-10",
        stayEndDate: "2026-07-12",
      };

      // when
      vi.useFakeTimers();
      try {
        vi.setSystemTime(new Date("2026-01-01T03:04:05.000Z"));
        const early = resolveEventDates(registration);
        vi.setSystemTime(new Date("2026-01-01T17:35:45.000Z"));
        const late = resolveEventDates(registration);

        // then
        expect(late.start.toISOString()).toBe(early.start.toISOString());
        expect(late.end.toISOString()).toBe(early.end.toISOString());
      } finally {
        vi.useRealTimers();
      }
    },
  );

  it.each([["__proto__"], ["SUN_ONLY"]])(
    "should resolve a defined window for the out-of-enum stay value %j with no custom range",
    (stay) => {
      // when
      const result = resolveEventDates({ stay: stay as StayOption });

      // then
      expect(result).toBeDefined();
      expect(Number.isFinite(result.start.getTime())).toBe(true);
      expect(result.end.getTime()).toBeGreaterThan(result.start.getTime());
    },
  );

  it("should resolve a range at each edge of the supported window", () => {
    // given
    // - the bounds themselves must be usable, not merely accepted
    const atMin = resolveEventDates({
      stay: StayOption.SAT_SUN,
      stayStartDate: SUPPORTED_STAY_DATE_MIN,
      stayEndDate: SUPPORTED_STAY_DATE_MIN,
    });
    const atMax = resolveEventDates({
      stay: StayOption.SAT_SUN,
      stayStartDate: SUPPORTED_STAY_DATE_MAX,
      stayEndDate: SUPPORTED_STAY_DATE_MAX,
    });

    // then
    expect(atMin.end.getTime()).toBeGreaterThan(atMin.start.getTime());
    expect(atMax.end.getTime()).toBeGreaterThan(atMax.start.getTime());
    // - and they are genuinely the custom range, not the fallback
    expect(atMin).not.toEqual(EVENT_DATES_BY_STAY[StayOption.SAT_SUN]);
    expect(atMax).not.toEqual(EVENT_DATES_BY_STAY[StayOption.SAT_SUN]);
  });
});

describe("defaultDateRangeForStay", () => {
  it.each([
    [StayOption.FRI_SAT, "2026-06-05", "2026-06-06"],
    [StayOption.SAT_SUN, "2026-06-06", "2026-06-07"],
    [StayOption.FRI_SUN, "2026-06-05", "2026-06-07"],
    [StayOption.SAT_ONLY, "2026-06-06", "2026-06-06"],
  ])(
    "should return the event-timezone calendar dates for %s",
    (stay, expectedStart, expectedEnd) => {
      // when
      const result = defaultDateRangeForStay(stay);

      // then
      expect(result).toEqual({ start: expectedStart, end: expectedEnd });
    },
  );

  it.each([
    [StayOption.FRI_SAT],
    [StayOption.SAT_SUN],
    [StayOption.FRI_SUN],
    [StayOption.SAT_ONLY],
  ])(
    "should round-trip %s through resolveEventDates back to the predefined instants",
    (stay) => {
      // given
      // - an admin who ticks "custom date range" (which prefills from the stay
      //   option) and saves without changing anything must not silently move
      //   the guest's calendar invite
      const { start, end } = defaultDateRangeForStay(stay);

      // when
      const resolved = resolveEventDates({ stay, stayStartDate: start, stayEndDate: end });

      // then
      expect(resolved).toEqual(EVENT_DATES_BY_STAY[stay]);
    },
  );
});
