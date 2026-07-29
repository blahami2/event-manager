import { describe, it, expect } from "vitest";

import { adminEditRegistrationSchema } from "@/lib/validation/registration";

/**
 * The admin edit endpoint accepts the whole registration, not just the custom
 * date range. Before this schema existed the route cast every field
 * (`name as string`, `adultsCount as number`, `registrationId as string`) and
 * handed the result to Prisma, so a malformed body reached the database as a
 * driver error — a `500` with no field-level detail, from an authenticated but
 * unvalidated payload.
 *
 * Administrators keep every capability they had: any stay option, any
 * accommodation, and an arbitrary custom date range. What they lose is the
 * ability to write values the domain model cannot hold.
 */

const VALID_ID = "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f";

/** A complete, valid payload; individual tests override one field at a time. */
function validPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    registrationId: VALID_ID,
    name: "Jane Doe",
    email: "jane@example.com",
    stay: "SAT_SUN",
    accommodation: "ANYWHERE",
    adultsCount: 2,
    childrenCount: 1,
    ...overrides,
  };
}

/** Collect Zod issues as a `field -> message` map, mirroring the API error shape. */
function fieldErrors(
  result: ReturnType<typeof adminEditRegistrationSchema.safeParse>,
): Record<string, string> {
  if (result.success) return {};
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    fields[issue.path.join(".")] = issue.message;
  }
  return fields;
}

describe("adminEditRegistrationSchema", () => {
  it("should accept a complete valid payload without a custom date range", () => {
    // when
    const result = adminEditRegistrationSchema.safeParse(validPayload());

    // then
    expect(result.success).toBe(true);
  });

  it("should accept a payload carrying a custom date range", () => {
    // when
    const result = adminEditRegistrationSchema.safeParse(
      validPayload({ stayStartDate: "2026-07-10", stayEndDate: "2026-07-17" }),
    );

    // then
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      stayStartDate: "2026-07-10",
      stayEndDate: "2026-07-17",
    });
  });

  it("should accept optional notes and omit them when absent", () => {
    // when
    const withNotes = adminEditRegistrationSchema.safeParse(validPayload({ notes: "vegan" }));
    const without = adminEditRegistrationSchema.safeParse(validPayload());

    // then
    expect(withNotes.data).toMatchObject({ notes: "vegan" });
    expect(without.success).toBe(true);
    expect(without.data).not.toHaveProperty("notes");
  });

  it("should reject a registrationId that is not a UUID", () => {
    // given
    // - the column is a Postgres uuid; a free-form string reaches the driver
    //   as an unhandled error rather than a validation failure
    const result = adminEditRegistrationSchema.safeParse(
      validPayload({ registrationId: "nonexistent" }),
    );

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("registrationId");
  });

  it("should reject a missing registrationId", () => {
    // given
    const payload = validPayload();
    delete payload["registrationId"];

    // when
    const result = adminEditRegistrationSchema.safeParse(payload);

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("registrationId");
  });

  it.each([
    ["name", { name: "" }],
    ["name", { name: "x".repeat(201) }],
    ["name", { name: 42 }],
    ["email", { email: "not-an-email" }],
    ["email", { email: null }],
    ["stay", { stay: "WHENEVER" }],
    ["accommodation", { accommodation: "PENTHOUSE" }],
    ["adultsCount", { adultsCount: 0 }],
    ["adultsCount", { adultsCount: 11 }],
    ["adultsCount", { adultsCount: 2.5 }],
    ["adultsCount", { adultsCount: "2" }],
    ["childrenCount", { childrenCount: -1 }],
    ["childrenCount", { childrenCount: 11 }],
    ["notes", { notes: "x".repeat(501) }],
  ])("should reject an invalid %s and name it in the field errors", (field, override) => {
    // when
    const result = adminEditRegistrationSchema.safeParse(validPayload(override));

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty(field);
  });

  it("should report every invalid field at once rather than only the first", () => {
    // given
    // - the admin sees all corrections in one round trip
    const result = adminEditRegistrationSchema.safeParse(
      validPayload({ email: "bad", adultsCount: 99 }),
    );

    // then
    const fields = fieldErrors(result);
    expect(fields).toHaveProperty("email");
    expect(fields).toHaveProperty("adultsCount");
  });

  it("should strip unknown keys so a client cannot set fields it does not own", () => {
    // given
    // - status and id are server-owned; a client must not be able to smuggle them
    const result = adminEditRegistrationSchema.safeParse(
      validPayload({ status: "CANCELLED", id: "other-id", createdAt: "2020-01-01" }),
    );

    // then
    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty("status");
    expect(result.data).not.toHaveProperty("id");
    expect(result.data).not.toHaveProperty("createdAt");
  });

  it("should reject a non-object body", () => {
    expect(adminEditRegistrationSchema.safeParse("not-a-body").success).toBe(false);
    expect(adminEditRegistrationSchema.safeParse(null).success).toBe(false);
    expect(adminEditRegistrationSchema.safeParse([]).success).toBe(false);
  });
});

/**
 * The three-state contract (`undefined` = leave alone, `null` = clear, a pair =
 * pin) is what stops a guest's manage-form edit from wiping an admin's range.
 * Validation must preserve it exactly: an absent key must not become `null`.
 */
describe("adminEditRegistrationSchema custom date range", () => {
  it("should leave both range keys absent when the payload omits them", () => {
    // when
    const result = adminEditRegistrationSchema.safeParse(validPayload());

    // then
    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty("stayStartDate");
    expect(result.data).not.toHaveProperty("stayEndDate");
  });

  it("should preserve explicit nulls when the admin clears the range", () => {
    // when
    const result = adminEditRegistrationSchema.safeParse(
      validPayload({ stayStartDate: null, stayEndDate: null }),
    );

    // then
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ stayStartDate: null, stayEndDate: null });
  });

  it("should normalize blank date inputs to null", () => {
    // when
    const result = adminEditRegistrationSchema.safeParse(
      validPayload({ stayStartDate: "", stayEndDate: "" }),
    );

    // then
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ stayStartDate: null, stayEndDate: null });
  });

  it("should reject a half-supplied range", () => {
    // when
    const result = adminEditRegistrationSchema.safeParse(
      validPayload({ stayStartDate: "2026-07-10" }),
    );

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayEndDate");
  });

  it("should reject an inverted range", () => {
    // when
    const result = adminEditRegistrationSchema.safeParse(
      validPayload({ stayStartDate: "2026-07-17", stayEndDate: "2026-07-10" }),
    );

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayEndDate");
  });

  it("should reject a range outside the supported window", () => {
    // when
    const result = adminEditRegistrationSchema.safeParse(
      validPayload({ stayStartDate: "1850-01-01", stayEndDate: "1850-01-05" }),
    );

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayStartDate");
  });

  it("should reject a date that is not a real calendar date", () => {
    // when
    const result = adminEditRegistrationSchema.safeParse(
      validPayload({ stayStartDate: "2026-02-30", stayEndDate: "2026-03-02" }),
    );

    // then
    expect(result.success).toBe(false);
    expect(fieldErrors(result)).toHaveProperty("stayStartDate");
  });
});
