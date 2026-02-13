import { z } from "zod";

/**
 * Zod validation schema for guest registration input.
 *
 * Enforces the domain constraints defined in docs/ARCHITECTURE.md Section 8.1:
 * - name: 1-200 characters
 * - email: valid email format
 * - guestCount: integer, 1-10
 * - dietaryNotes: optional, max 500 characters
 */
export const registrationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be at most 200 characters"),
  email: z
    .string()
    .email("Invalid email format"),
  guestCount: z
    .number()
    .int("Guest count must be a whole number")
    .min(1, "At least 1 guest required")
    .max(10, "Maximum 10 guests allowed"),
  dietaryNotes: z
    .string()
    .max(500, "Dietary notes must be at most 500 characters")
    .optional(),
});

/** Inferred type from the registration Zod schema. */
export type RegistrationSchemaInput = z.infer<typeof registrationSchema>;
