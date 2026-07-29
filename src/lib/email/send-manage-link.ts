import { Resend } from "resend";
import { getTranslations } from "next-intl/server";
import { logger, maskEmail } from "@/lib/logger";
import { generateIcsEvent } from "@/lib/email/ics-generator";
import { renderManageLinkEmail } from "@/lib/email/templates/manage-link-template";
import { resolveEventDates, type StayDatesSource } from "@/lib/event/stay-dates";
import { defaultLocale, type Locale } from "@/i18n/config";

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
  /**
   * Everything that determines the ICS calendar window: the guest's stay
   * option plus any admin-set custom date range that overrides it.
   *
   * Deliberately a single object rather than loose fields — a `RegistrationOutput`
   * satisfies it structurally, so call sites pass the registration they already
   * have and cannot forget to forward the range (which is exactly how the
   * resend-link path once shipped stale invite dates).
   */
  readonly stayDates: StayDatesSource;
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
 * Event details (name, location, description) are resolved from i18n translations.
 * Uses the `RESEND_API_KEY` environment variable (never hardcoded).
 */
export async function sendManageLink(
  params: SendManageLinkParams,
): Promise<SendManageLinkResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  const emailFrom = process.env["EMAIL_FROM"];

  if (!apiKey) {
    return { success: false, error: "Missing RESEND_API_KEY environment variable." };
  }

  if (!emailFrom) {
    return { success: false, error: "Missing EMAIL_FROM environment variable." };
  }

  const resend = new Resend(apiKey);
  const { to, manageUrl, guestName, registrationId, emailType, stayDates, locale } = params;

  const logContext = {
    registrationId,
    emailType,
    to: maskEmail(to),
  };

  const resolvedLocale = locale ?? defaultLocale;
  const t = await getTranslations({ locale: resolvedLocale, namespace: "email" });

  const { start: eventStart, end: eventEnd } = resolveEventDates(stayDates);
  const icsContent = generateIcsEvent({
    eventName: t("eventName"),
    eventDate: eventStart,
    eventEndDate: eventEnd,
    eventLocation: t("eventLocation"),
    eventDescription: t("eventDescription"),
    organizerEmail: emailFrom.includes("<") ? emailFrom.match(/<(.+)>/)?.[1] ?? emailFrom : emailFrom,
  });

  const { subject, html } = await renderManageLinkEmail({
    guestName,
    manageUrl,
    locale,
  });

  const { error } = await resend.emails.send({
    from: emailFrom,
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
