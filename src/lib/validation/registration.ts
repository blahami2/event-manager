import { z } from "zod";

/**
 * Stay option values matching the Prisma StayOption enum.
 */
const STAY_OPTIONS = ["FRI_SAT", "SAT_SUN", "FRI_SUN"] as const;

/**
 * Zod validation schema for guest registration input.
 *
 * Enforces the domain constraints defined in docs/ARCHITECTURE.md Section 8.1:
 * - name: 1-200 characters
 * - email: valid email format
 * - stay: one of FRI_SAT, SAT_SUN, FRI_SUN
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
    .enum(STAY_OPTIONS, { error: "Please select a stay option" }),
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
