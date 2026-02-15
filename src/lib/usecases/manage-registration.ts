import { findByTokenHash, revokeToken, revokeAllTokensForRegistration, createToken } from "@/repositories/token-repository";
import { findRegistrationById, updateRegistration, cancelRegistration } from "@/repositories/registration-repository";
import { hashToken, generateToken } from "@/lib/token/capability-token";
import { sendManageLink } from "@/lib/email/send-manage-link";
import { logger, maskEmail } from "@/lib/logger";
import { NotFoundError, ValidationError } from "@/lib/errors/app-errors";
import { registrationSchema } from "@/lib/validation/registration";
import { StayOption } from "@/types/registration";
import { TOKEN_EXPIRY_DAYS } from "@/config/limits";
import { EVENT_NAME, EVENT_DATE } from "@/config/event";
import type { RegistrationOutput } from "@/types/registration";

/**
 * Manage registration use case.
 *
 * Provides view, edit, and cancel operations via capability token.
 * Implements token rotation on updates and generic error messages
 * to prevent information leakage.
 *
 * See docs/ARCHITECTURE.md Section 7 for token security rules.
 */

/** Generic error message for all failed token lookups (no info leakage – S4). */
const TOKEN_NOT_FOUND_MESSAGE = "Link not found or expired";

interface UpdateRegistrationResult {
  readonly newManageUrl: string;
}

/**
 * Look up a token by its raw value and return the associated token data.
 *
 * @throws {NotFoundError} when the token is not found, revoked, or expired.
 */
async function resolveToken(rawToken: string): Promise<{ readonly id: string; readonly registrationId: string }> {
  const tokenHash = hashToken(rawToken);
  const tokenData = await findByTokenHash(tokenHash);

  if (!tokenData) {
    throw new NotFoundError(TOKEN_NOT_FOUND_MESSAGE);
  }

  return tokenData;
}

/**
 * View a registration by its capability token.
 *
 * Hashes the raw token, looks up the token record, then retrieves
 * the associated registration. Returns registration data or throws
 * a generic NotFoundError to prevent information leakage.
 *
 * @throws {NotFoundError} when token or registration is not found
 */
export async function getRegistrationByToken(
  rawToken: string,
): Promise<RegistrationOutput> {
  const tokenData = await resolveToken(rawToken);

  const registration = await findRegistrationById(tokenData.registrationId);

  if (!registration) {
    throw new NotFoundError(TOKEN_NOT_FOUND_MESSAGE);
  }

  logger.info("Registration viewed", {
    registrationId: registration.id,
    email: maskEmail(registration.email),
  });

  return registration;
}

/**
 * Update a registration by its capability token.
 *
 * Validates the input, updates the registration, rotates the token
 * (revokes old, generates new), sends email with new manage URL.
 *
 * @throws {NotFoundError} when token or registration is not found
 * @throws {ValidationError} when update data fails Zod validation
 */
export async function updateRegistrationByToken(
  rawToken: string,
  data: unknown,
): Promise<UpdateRegistrationResult> {
  const tokenData = await resolveToken(rawToken);

  // Validate input with Zod schema
  const parsed = registrationSchema.safeParse(data);

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const fieldName = issue.path.join(".");
      fields[fieldName] = issue.message;
    }
    throw new ValidationError("Validation failed", fields);
  }

  const { name, email, stay, adultsCount, childrenCount, notes } = parsed.data;

  // Update the registration record
  const updatedRegistration = await updateRegistration(tokenData.registrationId, {
    name,
    email,
    stay: stay as StayOption,
    adultsCount,
    childrenCount,
    notes,
  });

  // Token rotation: revoke old, generate new
  await revokeToken(tokenData.id);

  const { raw: newRaw, hash: newHash } = generateToken();
  const newExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await createToken(tokenData.registrationId, newHash, newExpiresAt);

  // Build new manage URL
  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const newManageUrl = `${baseUrl}/manage/${newRaw}`;

  // Send email with new manage URL
  await sendManageLink({
    to: updatedRegistration.email,
    manageUrl: newManageUrl,
    guestName: updatedRegistration.name,
    registrationId: updatedRegistration.id,
    emailType: "manage-link",
    stay: updatedRegistration.stay as StayOption,
    eventName: EVENT_NAME,
    eventDate: EVENT_DATE,
  });

  logger.info("Registration updated", {
    registrationId: updatedRegistration.id,
    email: maskEmail(updatedRegistration.email),
  });

  return { newManageUrl };
}

/**
 * Cancel a registration by its capability token.
 *
 * Cancels the registration and revokes all associated tokens.
 *
 * @throws {NotFoundError} when token is not found
 */
export async function cancelRegistrationByToken(
  rawToken: string,
): Promise<void> {
  const tokenData = await resolveToken(rawToken);

  await cancelRegistration(tokenData.registrationId);
  await revokeAllTokensForRegistration(tokenData.registrationId);

  logger.info("Registration cancelled", {
    registrationId: tokenData.registrationId,
  });
}
