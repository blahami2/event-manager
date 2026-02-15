import { findRegistrationByEmail } from "@/repositories/registration-repository";
import { revokeAllTokensForRegistration, createToken } from "@/repositories/token-repository";
import { generateToken } from "@/lib/token/capability-token";
import { sendManageLink } from "@/lib/email/send-manage-link";
import { logger, maskEmail } from "@/lib/logger";
import { TOKEN_EXPIRY_DAYS } from "@/config/limits";
import { EVENT_NAME, EVENT_DATE } from "@/config/event";
import { RegistrationStatus, StayOption } from "@/types/registration";

/**
 * Resend manage link use case.
 *
 * Always returns `{ success: true }` regardless of whether the email
 * exists in the system. This prevents email enumeration attacks (S5).
 *
 * For cancelled registrations: does NOT generate a new token, returns
 * success silently to avoid leaking registration state.
 *
 * See docs/ARCHITECTURE_RULES.md rule S5 and docs/ARCHITECTURE.md Section 12.3.
 */

interface ResendManageLinkResult {
  readonly success: true;
}

/**
 * Resend a manage link to the guest associated with the given email.
 *
 * If the email is found and the registration is confirmed:
 *   - revokes all existing tokens
 *   - generates a new token
 *   - sends an email with the new manage link
 *
 * If the email is NOT found, or the registration is cancelled:
 *   - does nothing, returns success (no info leakage)
 *
 * @param email - The guest email address
 * @returns Always `{ success: true }` regardless of email existence
 */
export async function resendManageLink(
  email: string,
): Promise<ResendManageLinkResult> {
  const registration = await findRegistrationByEmail(email);

  // If no registration found, or registration is cancelled, return success silently
  if (!registration || registration.status === RegistrationStatus.CANCELLED) {
    return { success: true };
  }

  // Revoke all existing tokens for this registration
  await revokeAllTokensForRegistration(registration.id);

  // Generate new token
  const { raw, hash } = generateToken();
  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );
  await createToken(registration.id, hash, expiresAt);

  // Build manage URL and send email
  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const manageUrl = `${baseUrl}/manage/${raw}`;

  await sendManageLink({
    to: registration.email,
    manageUrl,
    guestName: registration.name,
    registrationId: registration.id,
    emailType: "manage-link",
    stay: registration.stay as StayOption,
    eventName: EVENT_NAME,
    eventDate: EVENT_DATE,
  });

  // Log with masked email (never expose full email – LOG3, LOG4)
  logger.info("Manage link resent", {
    registrationId: registration.id,
    email: maskEmail(registration.email),
  });

  return { success: true };
}
