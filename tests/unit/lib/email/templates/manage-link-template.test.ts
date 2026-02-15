import { describe, test, expect, vi } from "vitest";

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

    const localeMessages = messages[locale as keyof typeof messages]?.[namespace] ?? messages.en![namespace]!
    
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

describe("renderManageLinkEmail", () => {
  const defaultParams = {
    guestName: "Alice Johnson",
    eventName: "Birthday Celebration",
    eventDate: "March 15, 2026",
    manageUrl: "https://example.com/manage?token=abc123",
  } as const;

  test("should return a string containing valid HTML structure", async () => {
    // given
    // - default params

    // when
    const html = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  test("should contain guest name in output HTML", async () => {
    // given
    // - default params with guestName "Alice Johnson"

    // when
    const html = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("Alice Johnson");
  });

  test("should contain event name in output HTML", async () => {
    // given
    // - default params with eventName "Birthday Celebration"

    // when
    const html = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("Birthday Celebration");
  });

  test("should contain event date in output HTML", async () => {
    // given
    // - default params with eventDate "March 15, 2026"

    // when
    const html = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("March 15, 2026");
  });

  test("should contain manage URL as a clickable anchor tag", async () => {
    // given
    // - default params with manageUrl

    // when
    const html = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain(`<a href="https://example.com/manage?token=abc123"`);
  });

  test("should use inline styles for responsiveness", async () => {
    // given
    // - default params

    // when
    const html = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("max-width");
    expect(html).toContain("style=");
    expect(html).not.toContain("<link");
    expect(html).not.toContain("<style");
  });

  test("should not contain raw template tokens in output", async () => {
    // given
    // - default params

    // when
    const html = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).not.toMatch(/\{\{.*\}\}/);
    expect(html).not.toMatch(/\$\{.*\}/);
    expect(html).not.toContain("{{guestName}}");
    expect(html).not.toContain("{{eventName}}");
    expect(html).not.toContain("{{eventDate}}");
    expect(html).not.toContain("{{manageUrl}}");
  });

  test("should escape HTML characters in guest name to prevent XSS", async () => {
    // given
    // - a guest name with HTML special characters
    const params = {
      ...defaultParams,
      guestName: '<script>alert("xss")</script>',
    };

    // when
    const html = await renderManageLinkEmail(params);

    // then
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("should escape HTML characters in event name", async () => {
    // given
    // - an event name with HTML special characters
    const params = {
      ...defaultParams,
      eventName: 'Party & "Fun" <Night>',
    };

    // when
    const html = await renderManageLinkEmail(params);

    // then
    expect(html).toContain("&amp;");
    expect(html).toContain("&quot;");
    expect(html).not.toContain('"Fun"');
  });

  test("should render all parameters together in a single output", async () => {
    // given
    const params = {
      guestName: "Bob Smith",
      eventName: "Summer Gala",
      eventDate: "July 4, 2026",
      manageUrl: "https://events.example.com/manage?token=xyz789",
    };

    // when
    const html = await renderManageLinkEmail(params);

    // then
    expect(html).toContain("Bob Smith");
    expect(html).toContain("Summer Gala");
    expect(html).toContain("July 4, 2026");
    expect(html).toContain(`<a href="https://events.example.com/manage?token=xyz789"`);
  });
});
