import { Resend } from "resend";
import { logger, maskEmail } from "@/lib/logger";

interface SendManageLinkParams {
  /** Recipient email address. */
  readonly to: string;
  /** Full manage URL including the capability token. */
  readonly manageUrl: string;
  /** Display name of the guest. */
  readonly guestName: string;
  /** Registration ID for structured logging. */
  readonly registrationId: string;
  /** Email type identifier for structured logging. */
  readonly emailType: "manage-link";
  /** Name of the event. */
  readonly eventName: string;
  /** Date of the event (display string). */
  readonly eventDate: string;
}

interface SendManageLinkResult {
  readonly success: boolean;
  readonly error?: string;
}

/**
 * Sends a manage-link email to a guest.
 *
 * Uses the `RESEND_API_KEY` environment variable (never hardcoded).
 */
export async function sendManageLink(
  params: SendManageLinkParams,
): Promise<SendManageLinkResult> {
  const apiKey = process.env["RESEND_API_KEY"];

  if (!apiKey) {
    return { success: false, error: "Missing RESEND_API_KEY environment variable." };
  }

  const resend = new Resend(apiKey);
  const { to, manageUrl, guestName, registrationId, emailType, eventName, eventDate } = params;

  const logContext = {
    registrationId,
    emailType,
    to: maskEmail(to),
  };

  const { error } = await resend.emails.send({
    from: "Birthday Celebration <noreply@resend.dev>",
    to,
    subject: "Your Registration Manage Link",
    html: `<p>Hi ${guestName},</p><p>You are registered for <strong>${eventName}</strong> on <strong>${eventDate}</strong>.</p><p>Use the link below to manage your registration:</p><p><a href="${manageUrl}">${manageUrl}</a></p>`,
  });

  if (error) {
    logger.error("Email send failed", { ...logContext, error: error.message });
    return { success: false, error: error.message };
  }

  logger.info("Email sent", logContext);
  return { success: true };
}
