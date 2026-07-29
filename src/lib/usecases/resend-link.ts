import { findRegistrationByEmail } from "@/repositories/registration-repository";
import {
  revokeAllTokensForRegistrationExcept,
  createToken,
} from "@/repositories/token-repository";
import { discardUndeliveredToken } from "@/lib/usecases/token-rotation";
import { generateToken } from "@/lib/token/capability-token";
import { sendManageLink } from "@/lib/email/send-manage-link";
import { logger, maskEmail } from "@/lib/logger";
import { TOKEN_EXPIRY_DAYS } from "@/config/limits";
import { RegistrationStatus } from "@/types/registration";

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
 *   - generates a new token and stores its hash
 *   - sends an email with the new manage link
 *   - only once that email is accepted, revokes every earlier token (T4)
 *
 * If the email is NOT found, or the registration is cancelled:
 *   - does nothing, returns success (no info leakage)
 *
 * The order matters. Revoking first — as this originally did — meant a failed
 * send took the guest's *existing* link with it: the one request whose purpose
 * is to restore access instead removed it, on the only path a locked-out guest
 * can trigger themselves. A failed send now revokes only the token that was
 * never delivered, so whatever the guest already holds keeps working and they
 * can simply try again.
 *
 * The send result is also checked rather than discarded, so a dropped email is
 * recorded as a failure instead of being logged as a successful resend.
 *
 * @param email - The guest email address
 * @returns Always `{ success: true }` regardless of email existence or delivery
 *   outcome — the response must not reveal either (S5, API4)
 */
export async function resendManageLink(
  email: string,
): Promise<ResendManageLinkResult> {
  const registration = await findRegistrationByEmail(email);

  // If no registration found, or registration is cancelled, return success silently
  if (!registration || registration.status === RegistrationStatus.CANCELLED) {
    return { success: true };
  }

  // Generate and store the replacement token. Existing tokens stay valid until
  // the email carrying this one has actually been accepted.
  const { raw, hash } = generateToken();
  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );
  const newToken = await createToken(registration.id, hash, expiresAt);

  // Build manage URL and send email
  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const manageUrl = `${baseUrl}/manage/${raw}`;

  let sendResult: { readonly success: boolean; readonly error?: string };
  try {
    sendResult = await sendManageLink({
      to: registration.email,
      manageUrl,
      guestName: registration.name,
      registrationId: registration.id,
      emailType: "manage-link",
      stayDates: registration,
    });
  } catch (error: unknown) {
    // An unexpected failure on the send path must not leave an undelivered
    // token live, and must not touch the tokens the guest may still hold.
    await discardUndeliveredToken(newToken.id, registration.id);
    throw error;
  }

  if (!sendResult.success) {
    await discardUndeliveredToken(newToken.id, registration.id);

    // Log with masked email (never expose full email – LOG3, LOG4). The public
    // response is unchanged; only the operator learns the send failed.
    logger.error("Manage link resend failed", {
      registrationId: registration.id,
      email: maskEmail(registration.email),
      error: sendResult.error,
    });

    return { success: true };
  }

  // The new link is in the guest's inbox, so every earlier one is superseded (T4).
  await revokeAllTokensForRegistrationExcept(registration.id, newToken.id);

  // Log with masked email (never expose full email – LOG3, LOG4)
  logger.info("Manage link resent", {
    registrationId: registration.id,
    email: maskEmail(registration.email),
  });

  return { success: true };
}
