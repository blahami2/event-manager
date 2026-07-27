import { z } from "zod";

import { SUPPORTED_STAY_DATE_MAX, SUPPORTED_STAY_DATE_MIN } from "@/config/event";
import { isIsoDate, parseIsoDate } from "@/lib/date/iso-date";
import { AccommodationOption, StayOption } from "@/types/registration";

/**
 * Enum fields validate against the shared domain enums rather than a duplicated
 * literal list, so a parsed payload is typed as `StayOption` /
 * `AccommodationOption` directly. Consumers can therefore build a
 * `RegistrationInput` from parsed data without casting — the casts these
 * schemas used to force were exactly what let unvalidated values through on the
 * admin edit path.
 */

/**
 * Zod validation schema for guest registration input.
 *
 * Enforces the domain constraints defined in docs/ARCHITECTURE.md Section 8.1:
 * - name: 1-200 characters
 * - email: valid email format
 * - stay: one of FRI_SAT, SAT_SUN, FRI_SUN, SAT_ONLY
 * - adultsCount: integer, 1-10
 * - childrenCount: integer, 0-10
 * - notes: optional, max 500 characters
 */
export const registrationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be at most 200 characters"),
  email: z
    .string()
    .email("Invalid email format"),
  stay: z
    .enum(StayOption, { error: "Please select a stay option" }),
  accommodation: z
    .enum(AccommodationOption, { error: "Please select an accommodation option" }),
  adultsCount: z
    .number()
    .int("Adults count must be a whole number")
    .min(1, "At least 1 adult required")
    .max(10, "Maximum 10 adults allowed"),
  childrenCount: z
    .number()
    .int("Children count must be a whole number")
    .min(0, "Children count cannot be negative")
    .max(10, "Maximum 10 children allowed"),
  notes: z
    .string()
    .max(500, "Notes must be at most 500 characters")
    .optional(),
});

/** Inferred type from the registration Zod schema. */
export type RegistrationSchemaInput = z.infer<typeof registrationSchema>;

// ---------------------------------------------------------------------------
// Custom stay date range (admin only — see issue #101)
// ---------------------------------------------------------------------------

/** Message used for both malformed and non-existent calendar dates. */
const CALENDAR_DATE_MESSAGE = "Date must be a valid calendar date in YYYY-MM-DD format";

/** Message used when exactly one of the two range endpoints is supplied. */
const INCOMPLETE_RANGE_MESSAGE = "Both start and end dates are required for a custom date range";

/** Message used when the range is inverted. */
const RANGE_ORDER_MESSAGE = "End date must not be before the start date";

/** Message used when a date falls outside the supported window. */
const OUT_OF_WINDOW_MESSAGE = `Date must be between ${SUPPORTED_STAY_DATE_MIN} and ${SUPPORTED_STAY_DATE_MAX}`;

/** Message used when the registration identifier is not a UUID. */
const REGISTRATION_ID_MESSAGE = "registrationId must be a valid UUID";

/**
 * Whether a calendar date lies inside the window the system can represent.
 *
 * A plain string comparison is exact for zero-padded `YYYY-MM-DD`, which sorts
 * lexicographically in chronological order.
 */
function isWithinSupportedWindow(value: string): boolean {
  return value >= SUPPORTED_STAY_DATE_MIN && value <= SUPPORTED_STAY_DATE_MAX;
}

/**
 * A calendar date that the rest of the system can carry end to end: a real
 * date, inside the supported window.
 *
 * The two checks are one `superRefine` rather than two chained `refine`s so a
 * malformed value yields only the "not a valid date" message, instead of also
 * claiming it is out of range.
 */
const supportedCalendarDate = z.string({ error: CALENDAR_DATE_MESSAGE }).superRefine((value, ctx) => {
  if (!isIsoDate(value)) {
    ctx.addIssue({ code: "custom", message: CALENDAR_DATE_MESSAGE });
    return;
  }

  if (!isWithinSupportedWindow(value)) {
    ctx.addIssue({ code: "custom", message: OUT_OF_WINDOW_MESSAGE });
  }
});

/**
 * One endpoint of a custom stay range, where an absent key means "no range".
 *
 * Absent and blank values both normalize to `null` so that "no custom range"
 * has a single representation regardless of whether it came from a JSON body
 * that omits the key or from an emptied `<input type="date">`.
 */
const calendarDateField = z.preprocess(
  (value) => (value === undefined || value === "" ? null : value),
  z.nullable(supportedCalendarDate),
);

/**
 * One endpoint of a custom stay range, where an absent key means "leave the
 * stored value alone".
 *
 * The distinction from {@link calendarDateField} is the three-state contract on
 * {@link RegistrationInput}: on the admin edit endpoint an omitted key must stay
 * omitted all the way to the repository, because collapsing it to `null` would
 * clear a range the caller never mentioned.
 */
const optionalCalendarDateField = z.optional(
  z.preprocess((value) => (value === "" ? null : value), z.nullable(supportedCalendarDate)),
);

/** The pair of range endpoints, in either of their two representations. */
interface StayDateRangeValue {
  readonly stayStartDate?: string | null | undefined;
  readonly stayEndDate?: string | null | undefined;
}

/**
 * Cross-field rules for a custom stay range: the pair must be complete and must
 * not be inverted.
 *
 * Shared by both schemas below so the guest-facing and admin-facing paths cannot
 * drift. Absent and `null` are treated alike here — "no value on this endpoint"
 * — because a range with only one endpoint is incomplete however it was
 * expressed.
 */
function refineStayDateRange(value: StayDateRangeValue, ctx: z.RefinementCtx): void {
  const stayStartDate = value.stayStartDate ?? null;
  const stayEndDate = value.stayEndDate ?? null;

  if (stayStartDate === null && stayEndDate === null) {
    return;
  }

  if (stayStartDate === null) {
    ctx.addIssue({
      code: "custom",
      path: ["stayStartDate"],
      message: INCOMPLETE_RANGE_MESSAGE,
    });
    return;
  }

  if (stayEndDate === null) {
    ctx.addIssue({
      code: "custom",
      path: ["stayEndDate"],
      message: INCOMPLETE_RANGE_MESSAGE,
    });
    return;
  }

  const start = parseIsoDate(stayStartDate);
  const end = parseIsoDate(stayEndDate);

  if (start && end && end.getTime() < start.getTime()) {
    ctx.addIssue({
      code: "custom",
      path: ["stayEndDate"],
      message: RANGE_ORDER_MESSAGE,
    });
  }
}

/**
 * Validation for an administrator-supplied custom stay date range.
 *
 * Administrators are deliberately **not** limited to the predefined stay
 * options' dates — any range is accepted, including ranges far outside the
 * event weekend. The constraints are that the pair is complete, that both
 * endpoints are real calendar dates inside the supported window
 * (`SUPPORTED_STAY_DATE_MIN`…`_MAX`, see `src/config/event.ts`), and that the
 * range is not inverted. A single-day range (start equal to end) is valid and
 * represents a day visit.
 *
 * The window is not decoration: the range is converted to venue-local instants
 * for every calendar invite, on a code path that runs after the guest's
 * capability token has been rotated. A date the conversion cannot represent has
 * to be refused here, where the caller can still be told which field is wrong.
 */
export const stayDateRangeSchema = z
  .object({
    stayStartDate: calendarDateField,
    stayEndDate: calendarDateField,
  })
  .superRefine(refineStayDateRange);

/** Inferred type from the custom stay date range schema. */
export type StayDateRangeInput = z.infer<typeof stayDateRangeSchema>;

/**
 * Validation for the whole body of `PUT /api/admin/registrations`.
 *
 * Administrators keep every capability the feature gives them — any stay
 * option, any accommodation, and an arbitrary custom date range — while the
 * fields themselves are held to the same domain constraints as every other
 * write path (`registrationSchema`), which is also what admin-initiated
 * *creation* already enforces via `registerGuest`. What is removed is the
 * ability to write values the domain model cannot hold: the endpoint used to
 * cast each field and hand it to the repository, so a malformed body surfaced
 * as an opaque database error instead of a field-level `400`.
 *
 * Unknown keys are stripped rather than forwarded, so a client cannot smuggle
 * server-owned fields (`status`, `id`) into an update.
 */
export const adminEditRegistrationSchema = registrationSchema
  .extend({
    registrationId: z.uuid({ error: REGISTRATION_ID_MESSAGE }),
    stayStartDate: optionalCalendarDateField,
    stayEndDate: optionalCalendarDateField,
  })
  .superRefine(refineStayDateRange);

/** Inferred type from the admin edit schema. */
export type AdminEditRegistrationInput = z.infer<typeof adminEditRegistrationSchema>;
