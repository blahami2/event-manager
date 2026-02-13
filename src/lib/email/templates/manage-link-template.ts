/**
 * Email template for sending manage-link emails to guests.
 * Uses inline styles only for email client compatibility.
 */

interface ManageLinkEmailParams {
  readonly guestName: string;
  readonly eventName: string;
  readonly eventDate: string;
  readonly manageUrl: string;
}

/** Escapes HTML special characters to prevent XSS in email output. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Renders a responsive HTML email for the manage-link flow.
 *
 * @param params - Guest name, event name, event date, and manage URL.
 * @returns A complete HTML string ready to be sent as an email body.
 */
export function renderManageLinkEmail(params: ManageLinkEmailParams): string {
  const guestName = escapeHtml(params.guestName);
  const eventName = escapeHtml(params.eventName);
  const eventDate = escapeHtml(params.eventDate);
  const { manageUrl } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Manage Your Registration</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 32px 24px; text-align: center; background-color: #4f46e5;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${eventName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 24px;">
              <p style="margin: 0 0 16px; color: #333333; font-size: 16px; line-height: 1.5;">Hi ${guestName},</p>
              <p style="margin: 0 0 16px; color: #333333; font-size: 16px; line-height: 1.5;">Thank you for registering for <strong>${eventName}</strong> on <strong>${eventDate}</strong>.</p>
              <p style="margin: 0 0 24px; color: #333333; font-size: 16px; line-height: 1.5;">Use the button below to manage your registration details at any time:</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 6px; background-color: #4f46e5;">
                    <a href="${manageUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px;">Manage Registration</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; color: #666666; font-size: 14px; line-height: 1.5;">If the button above doesn't work, copy and paste this link into your browser:</p>
              <p style="margin: 8px 0 0; word-break: break-all;"><a href="${manageUrl}" style="color: #4f46e5; font-size: 14px;">${manageUrl}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated message. Please do not reply directly.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
