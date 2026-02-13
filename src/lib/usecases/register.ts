import { createRegistration } from "@/repositories/registration-repository";
import { createToken } from "@/repositories/token-repository";
import { generateToken } from "@/lib/token/capability-token";
import { sendManageLink } from "@/lib/email/send-manage-link";
import { logger, maskEmail } from "@/lib/logger";
import { ValidationError } from "@/lib/errors/app-errors";
import { registrationSchema } from "@/lib/validation/registration";
import { TOKEN_EXPIRY_DAYS } from "@/config/limits";
import { EVENT_NAME, EVENT_DATE } from "@/config/event";

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
 * @throws {ValidationError} when input fails Zod validation
 */
export async function registerGuest(
  input: unknown,
): Promise<RegisterGuestResult> {
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

  const { name, email, guestCount, dietaryNotes } = parsed.data;

  // Step 2: Create the registration record
  const registration = await createRegistration({
    name,
    email,
    guestCount,
    dietaryNotes,
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
    eventName: EVENT_NAME,
    eventDate: EVENT_DATE,
  });

  // Step 6: Log registration creation (with masked email)
  logger.info("Registration created", {
    registrationId: registration.id,
    email: maskEmail(email),
  });

  return { registrationId: registration.id };
}
