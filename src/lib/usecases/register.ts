import { createRegistration } from "@/repositories/registration-repository";
import { createToken } from "@/repositories/token-repository";
import { generateToken } from "@/lib/token/capability-token";
import { sendManageLink } from "@/lib/email/send-manage-link";
import { logger, maskEmail } from "@/lib/logger";
import { ValidationError } from "@/lib/errors/app-errors";
import { registrationSchema } from "@/lib/validation/registration";
import { StayOption, AccommodationOption } from "@/types/registration";
import { TOKEN_EXPIRY_DAYS } from "@/config/limits";
import { REGISTRATION_DEADLINE } from "@/config/event";

/**
 * Result returned by {@link registerGuest}.
 *
 * Contains only the registration ID. The raw capability token is never
 * exposed to the caller — it is sent exclusively via email.
 */
interface RegisterGuestResult {
  readonly registrationId: string;
}

/**
 * Optional behaviour flags for {@link registerGuest}.
 *
 * `bypassDeadline` may ONLY be set server-side by admin-authenticated
 * handlers. The public registration endpoint MUST never forward this
 * flag from client input; doing so would let a guest register past the
 * published cut-off.
 */
export interface RegisterGuestOptions {
  readonly bypassDeadline?: boolean;
}

/**
 * Register a new guest for the event.
 *
 * Orchestrates the full registration flow:
 * 1. Validate input with Zod schema
 * 2. Create the registration record
 * 3. Generate a capability token pair (raw + hash)
 * 4. Store the token hash in the database
 * 5. Send the manage link (with raw token) via email
 * 6. Return only the registration ID
 *
 * When `options.bypassDeadline` is `true`, the deadline check at step 0
 * is skipped. This path is reserved for admin-authenticated callers who
 * legitimately need to register guests after the public cut-off; all
 * other steps (input validation, token generation, email delivery) are
 * unchanged.
 *
 * @throws {ValidationError} when input fails Zod validation, or when the
 *   deadline has passed and the caller did not opt into bypassing it.
 */
export async function registerGuest(
  input: unknown,
  options: RegisterGuestOptions = {},
): Promise<RegisterGuestResult> {
  const bypassDeadline = options.bypassDeadline === true;

  // Step 0: Check deadline (skipped for admin-authorised bypass).
  if (!bypassDeadline && new Date() > REGISTRATION_DEADLINE) {
    throw new ValidationError("Registration is closed", {});
  }

  // Step 1: Validate input
  const parsed = registrationSchema.safeParse(input);

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const fieldName = issue.path.join(".");
      fields[fieldName] = issue.message;
    }
    throw new ValidationError("Validation failed", fields);
  }

  const { name, email, stay, accommodation, adultsCount, childrenCount, notes } = parsed.data;

  // Step 2: Create the registration record
  const registration = await createRegistration({
    name,
    email,
    stay: stay as StayOption,
    accommodation: accommodation as AccommodationOption,
    adultsCount,
    childrenCount,
    notes,
  });

  // Step 3: Generate a capability token
  const { raw, hash } = generateToken();

  // Step 4: Store the token hash
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await createToken(registration.id, hash, expiresAt);

  // Step 5: Send manage link via email
  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const manageUrl = `${baseUrl}/manage/${raw}`;

  await sendManageLink({
    to: email,
    manageUrl,
    guestName: name,
    registrationId: registration.id,
    emailType: "manage-link",
    stay: stay as StayOption,
  });

  // Step 6: Log registration creation (with masked email)
  logger.info("Registration created", {
    registrationId: registration.id,
    email: maskEmail(email),
  });

  return { registrationId: registration.id };
}
