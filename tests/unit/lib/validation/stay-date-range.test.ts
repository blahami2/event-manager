import { describe, it, expect } from "vitest";

import { SUPPORTED_STAY_DATE_MAX, SUPPORTED_STAY_DATE_MIN } from "@/config/event";
import { stayDateRangeSchema } from "@/lib/validation/registration";

/**
 * Admin-set custom stay ranges are arbitrary within the supported window: any
 * start date, any end date, as long as the pair is complete, well-formed,
 * chronologically ordered, and inside `SUPPORTED_STAY_DATE_MIN`…`_MAX`. There is
 * deliberately no clamping to the event weekend — only to the window the rest of
 * the system can faithfully represent.
 */

/** Collect Zod issues as a `field -> message` map, mirroring the API error shape. */
function fieldErrors(result: ReturnType<typeof stayDateRangeSchema.safeParse>): Record<string, string> {
  if (result.success) return {};
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    fields[issue.path.join(".")] = issue.message;
  }
  return fields;
}

describe("stayDateRangeSchema", () => {
  it("should accept a multi-day range when both dates are well-formed and ordered", () => {
    // given
    const input = { stayStartDate: "2026-06-05", stayEndDate: "2026-06-08" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ stayStartDate: "2026-06-05", stayEndDate: "2026-06-08" });
  });

  it("should accept a single-day range when start and end are the same date", () => {
    // given
    // - a day visit: arrival and departure on the same calendar date
    const input = { stayStartDate: "2026-06-06", stayEndDate: "2026-06-06" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(true);
  });

  it("should accept a range far outside the predefined event weekend", () => {
    // given
    // - the whole point of the feature: admins are not limited to the
    //   predefined stay options' dates
    const input = { stayStartDate: "2025-01-01", stayEndDate: "2027-12-31" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(true);
  });

  it("should accept an empty range when both dates are null", () => {
    // given
    // - clearing the custom range falls back to the predefined stay option
    const input = { stayStartDate: null, stayEndDate: null };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ stayStartDate: null, stayEndDate: null });
  });

  it("should normalize omitted dates to null when neither field is present", () => {
    // given
    // - legacy callers (public manage form) never send the fields at all
    const input = {};

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ stayStartDate: null, stayEndDate: null });
  });

  it("should normalize empty strings to null when both fields are blank", () => {
    // given
    // - a blank date input serializes as "" rather than null
    const input = { stayStartDate: "", stayEndDate: "" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ stayStartDate: null, stayEndDate: null });
  });

  it("should reject the range when only the start date is provided", () => {
    // given
    const input = { stayStartDate: "2026-06-05", stayEndDate: null };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayEndDate");
  });

  it("should reject the range when only the end date is provided", () => {
    // given
    const input = { stayStartDate: null, stayEndDate: "2026-06-08" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayStartDate");
  });

  it("should reject the range when the end date precedes the start date", () => {
    // given
    // - one day inverted is still inverted
    const input = { stayStartDate: "2026-06-08", stayEndDate: "2026-06-07" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayEndDate");
  });

  it("should reject the range when a date is not a real calendar date", () => {
    // given
    // - 30 February never exists
    const input = { stayStartDate: "2026-02-30", stayEndDate: "2026-03-02" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayStartDate");
  });

  it("should reject the range when a date is malformed", () => {
    // given
    const input = { stayStartDate: "05/06/2026", stayEndDate: "2026-06-08" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayStartDate");
  });

  it("should reject the range when a date is not a string", () => {
    // given
    const input = { stayStartDate: 20260605, stayEndDate: "2026-06-08" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayStartDate");
  });
});

/**
 * The supported window exists because the range is not just stored — it is
 * converted to venue-local instants for every calendar invite. Outside the
 * window that conversion has no faithful answer (pre-1891 the venue ran on a
 * local mean time offset of 57 minutes 44 seconds), so a date that cannot be
 * represented must be refused at the door rather than discovered later, on the
 * email path, after a guest's token has already been rotated.
 */
describe("stayDateRangeSchema supported window", () => {
  it("should accept a range that starts exactly on the earliest supported date", () => {
    // given
    const input = { stayStartDate: SUPPORTED_STAY_DATE_MIN, stayEndDate: "2026-06-08" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(true);
  });

  it("should accept a range that ends exactly on the latest supported date", () => {
    // given
    const input = { stayStartDate: "2026-06-08", stayEndDate: SUPPORTED_STAY_DATE_MAX };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(true);
  });

  it("should reject a start date before the earliest supported date", () => {
    // given
    // - a date whose venue-local offset the tz database reports in seconds
    const input = { stayStartDate: "1850-01-01", stayEndDate: "2026-06-08" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayStartDate");
  });

  it("should reject an end date after the latest supported date", () => {
    // given
    const input = { stayStartDate: "2026-06-08", stayEndDate: "9999-12-31" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayEndDate");
  });

  it("should reject the day before the earliest supported date", () => {
    // given
    // - off-by-one at the boundary, from the rejected side
    const input = { stayStartDate: "1999-12-31", stayEndDate: "2026-06-08" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayStartDate");
  });

  it("should reject the day after the latest supported date", () => {
    // given
    const input = { stayStartDate: "2026-06-08", stayEndDate: "2101-01-01" };

    // when
    const result = stayDateRangeSchema.safeParse(input);

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayEndDate");
  });
});
