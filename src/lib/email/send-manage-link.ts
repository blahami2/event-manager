import { Resend } from "resend";

interface SendManageLinkParams {
  /** Recipient email address. */
  readonly to: string;
  /** Full manage URL including the capability token. */
  readonly manageUrl: string;
  /** Display name of the guest. */
  readonly guestName: string;
}

interface SendManageLinkResult {
  readonly success: boolean;
  readonly error?: string;
}

/**
 * Sends a manage-link email to a guest.
 *
 * This is a stub implementation. The full email body and HTML template
 * will be added in T-020. For now the email contains a plain-text link.
 *
 * Uses the `RESEND_API_KEY` environment variable (never hardcoded).
 */
export async function sendManageLink(
  params: SendManageLinkParams,
): Promise<SendManageLinkResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { success: false, error: "Missing RESEND_API_KEY environment variable." };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: "Birthday Celebration <noreply@resend.dev>",
    to: params.to,
    subject: "Your Registration Manage Link",
    html: `<p>Hi ${params.guestName},</p><p>Use the link below to manage your registration:</p><p><a href="${params.manageUrl}">${params.manageUrl}</a></p>`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
