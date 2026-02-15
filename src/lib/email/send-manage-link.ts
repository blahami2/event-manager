import { Resend } from "resend";
import { logger, maskEmail } from "@/lib/logger";
import { generateIcsEvent } from "@/lib/email/ics-generator";
import { renderManageLinkEmail } from "@/lib/email/templates/manage-link-template";
import {
  EVENT_NAME,
  EVENT_LOCATION,
  EVENT_DESCRIPTION,
  EVENT_DATES_BY_STAY,
} from "@/config/event";
import type { StayOption } from "@/types/registration";
import type { Locale } from "@/i18n/config";

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
  /** Guest's selected stay option, determines ICS calendar dates. */
  readonly stay: StayOption;
  /** Name of the event. */
  readonly eventName: string;
  /** Date of the event (display string). */
  readonly eventDate: string;
  /** Locale for email content. Defaults to 'en'. */
  readonly locale?: Locale;
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
  const { to, manageUrl, guestName, registrationId, emailType, stay, eventName, eventDate, locale } = params;

  const logContext = {
    registrationId,
    emailType,
    to: maskEmail(to),
  };

  const { start: eventStart, end: eventEnd } = EVENT_DATES_BY_STAY[stay];
  const icsContent = generateIcsEvent({
    eventName: EVENT_NAME,
    eventDate: eventStart,
    eventEndDate: eventEnd,
    eventLocation: EVENT_LOCATION,
    eventDescription: EVENT_DESCRIPTION,
    organizerEmail: "noreply@resend.dev",
  });

  const { subject, html } = await renderManageLinkEmail({
    guestName,
    eventName,
    eventDate,
    manageUrl,
    locale,
  });

  const { error } = await resend.emails.send({
    from: "Birthday Celebration <noreply@resend.dev>",
    to,
    subject,
    html,
    attachments: [
      {
        filename: "event.ics",
        content: Buffer.from(icsContent).toString("base64"),
        contentType: "text/calendar; method=REQUEST",
      },
    ],
  });

  if (error) {
    logger.error("Email send failed", { ...logContext, error: error.message });
    return { success: false, error: error.message };
  }

  logger.info("Email sent", logContext);
  return { success: true };
}
