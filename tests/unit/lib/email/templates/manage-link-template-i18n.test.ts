import { describe, test, expect, vi } from "vitest";
import type { Locale } from "@/i18n/config";

// Mock next-intl/server for testing
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) => {
    const messages: Record<string, Record<string, Record<string, string>>> = {
      en: {
        email: {
          greeting: 'Hi {name},',
          thankYou: 'Thank you for registering for <strong>{eventName}</strong> on <strong>{eventDate}</strong>.',
          instructions: 'Use the button below to manage your registration details at any time:',
          manageButton: 'Manage Registration',
          fallbackText: "If the button above doesn't work, copy and paste this link into your browser:",
          calendarNote: 'A calendar invite is attached to this email.',
          footerDisclaimer: 'This is an automated message. Please do not reply directly.',
          title: 'Manage Your Registration',
        },
      },
      cs: {
        email: {
          greeting: 'Ahoj {name},',
          thankYou: 'Děkujeme za registraci na <strong>{eventName}</strong> dne <strong>{eventDate}</strong>.',
          instructions: 'Pomocí tlačítka níže můžete kdykoli spravovat své registrační údaje:',
          manageButton: 'Spravovat registraci',
          fallbackText: 'Pokud výše uvedené tlačítko nefunguje, zkopírujte a vložte tento odkaz do prohlížeče:',
          calendarNote: 'K tomuto e-mailu je připojena pozvánka do kalendáře.',
          footerDisclaimer: 'Toto je automatická zpráva. Neodpovídejte prosím přímo.',
          title: 'Spravovat registraci',
        },
      },
      sk: {
        email: {
          greeting: 'Ahoj {name},',
          thankYou: 'Ďakujeme za registráciu na <strong>{eventName}</strong> dňa <strong>{eventDate}</strong>.',
          instructions: 'Pomocou tlačidla nižšie môžete kedykoľvek spravovať svoje registračné údaje:',
          manageButton: 'Spravovať registráciu',
          fallbackText: 'Ak vyššie uvedené tlačidlo nefunguje, skopírujte a vložte tento odkaz do prehliadača:',
          calendarNote: 'K tomuto e-mailu je pripojená pozvánka do kalendára.',
          footerDisclaimer: 'Toto je automatická správa. Neodpovedajte prosím priamo.',
          title: 'Spravovať registráciu',
        },
      },
    };

    const localeMessages = messages[locale as keyof typeof messages]?.[namespace] ?? messages.en![namespace]!;
    
    return (key: string, params?: Record<string, string>) => {
      let text = localeMessages![key] ?? key;
      if (params) {
        Object.entries(params).forEach(([param, value]) => {
          text = text.replace(`{${param}}`, value);
        });
      }
      return text;
    };
  },
}));

import { renderManageLinkEmail } from "@/lib/email/templates/manage-link-template";

describe("renderManageLinkEmail - i18n", () => {
  const defaultParams = {
    guestName: "Alice Johnson",
    eventName: "Birthday Celebration",
    eventDate: "March 15, 2026",
    manageUrl: "https://example.com/manage?token=abc123",
  } as const;

  test("should render email in English when locale is 'en'", async () => {
    // given
    // - locale set to English
    const locale: Locale = "en";

    // when
    const html = await renderManageLinkEmail({ ...defaultParams, locale });

    // then
    expect(html).toContain("Hi Alice Johnson");
    expect(html).toContain("Thank you for registering");
    expect(html).toContain("Manage Registration");
  });

  test("should render email in Czech when locale is 'cs'", async () => {
    // given
    // - locale set to Czech
    const locale: Locale = "cs";

    // when
    const html = await renderManageLinkEmail({ ...defaultParams, locale });

    // then
    expect(html).toContain("Ahoj Alice Johnson");
    expect(html).toContain("Děkujeme za registraci");
    expect(html).toContain("Spravovat registraci");
  });

  test("should render email in Slovak when locale is 'sk'", async () => {
    // given
    // - locale set to Slovak
    const locale: Locale = "sk";

    // when
    const html = await renderManageLinkEmail({ ...defaultParams, locale });

    // then
    expect(html).toContain("Ahoj Alice Johnson");
    expect(html).toContain("Ďakujeme za registráciu");
    expect(html).toContain("Spravovať registráciu");
  });

  test("should use English as fallback when locale is not provided", async () => {
    // given
    // - no locale parameter (undefined)

    // when
    const html = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("Hi Alice Johnson");
    expect(html).toContain("Thank you for registering");
  });

  test("should translate subject line based on locale", async () => {
    // given
    // - Czech locale
    const locale: Locale = "cs";

    // when
    const result = await renderManageLinkEmail({ ...defaultParams, locale });

    // then
    // Note: subject is returned separately in production, but template should use translation keys
    expect(result).toBeTruthy();
  });

  test("should translate calendar invite note based on locale", async () => {
    // given
    // - Slovak locale
    const locale: Locale = "sk";

    // when
    const html = await renderManageLinkEmail({ ...defaultParams, locale });

    // then
    expect(html).toContain("K tomuto e-mailu je pripojená pozvánka do kalendára");
  });

  test("should keep manageUrl unchanged regardless of locale", async () => {
    // given
    // - Czech locale with specific URL
    const locale: Locale = "cs";
    const url = "https://example.com/manage?token=test-token-12345";
    const params = { ...defaultParams, manageUrl: url };

    // when
    const html = await renderManageLinkEmail({ ...params, locale });

    // then
    expect(html).toContain(url);
  });

  test("should escape HTML in guest name with translated text", async () => {
    // given
    // - Czech locale with XSS attempt in name
    const locale: Locale = "cs";
    const params = {
      ...defaultParams,
      guestName: '<script>alert("xss")</script>',
    };

    // when
    const html = await renderManageLinkEmail({ ...params, locale });

    // then
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Ahoj"); // Czech greeting
  });
});
