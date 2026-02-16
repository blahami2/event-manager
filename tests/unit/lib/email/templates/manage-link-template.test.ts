import { describe, test, expect, vi } from "vitest";

const { mockGetTranslations } = vi.hoisted(() => ({
  mockGetTranslations: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: mockGetTranslations,
}));

import { renderManageLinkEmail } from "@/lib/email/templates/manage-link-template";

// Load actual translation messages for realistic testing
import enMessages from "@/i18n/messages/en.json";
import csMessages from "@/i18n/messages/cs.json";
import skMessages from "@/i18n/messages/sk.json";

type EmailMessages = typeof enMessages.email;

/**
 * Creates a mock translation function that resolves keys from actual message files.
 * Supports simple interpolation with {param} syntax.
 */
function createMockTranslator(messages: EmailMessages) {
  return (key: string, params?: Record<string, string>): string => {
    const value = messages[key as keyof EmailMessages];
    if (!value) return key;
    if (!params) return value;
    return Object.entries(params).reduce(
      (result, [paramKey, paramValue]) =>
        result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), paramValue),
      value,
    );
  };
}

describe("renderManageLinkEmail", () => {
  const defaultParams = {
    guestName: "Alice Johnson",
    manageUrl: "https://example.com/manage?token=test-token-12345678",
  } as const;

  function setupMockTranslator(messages: EmailMessages): void {
    mockGetTranslations.mockResolvedValue(createMockTranslator(messages));
  }

  test("should return a string containing valid HTML structure when rendered in English", async () => {
    // given
    setupMockTranslator(enMessages.email);

    // when
    const { html } = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("<!DOCTYPE html");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  test("should contain guest name in output HTML", async () => {
    // given
    setupMockTranslator(enMessages.email);

    // when
    const { html } = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("Alice Johnson");
  });

  test("should contain event name from i18n translations in output HTML", async () => {
    // given
    setupMockTranslator(enMessages.email);

    // when
    const { html } = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("Triple threat");
  });

  test("should contain event date from i18n translations in output HTML", async () => {
    // given
    setupMockTranslator(enMessages.email);

    // when
    const { html } = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("Saturday, June 6, 2026");
  });

  test("should contain manage URL as a clickable anchor tag", async () => {
    // given
    setupMockTranslator(enMessages.email);

    // when
    const { html } = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain(`<a href="https://example.com/manage?token=test-token-12345678"`);
  });

  test("should use inline styles for responsiveness", async () => {
    // given
    setupMockTranslator(enMessages.email);

    // when
    const { html } = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("max-width");
    expect(html).toContain("style=");
    expect(html).not.toContain("<link");
    expect(html).not.toContain("<style");
  });

  test("should not contain raw template tokens in output", async () => {
    // given
    setupMockTranslator(enMessages.email);

    // when
    const { html } = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).not.toMatch(/\{\{.*\}\}/);
    expect(html).not.toMatch(/\$\{.*\}/);
  });

  test("should escape HTML characters in guest name to prevent XSS", async () => {
    // given
    setupMockTranslator(enMessages.email);
    const params = {
      ...defaultParams,
      guestName: '<script>alert("xss")</script>',
    };

    // when
    const { html } = await renderManageLinkEmail(params);

    // then
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("should return translated subject line", async () => {
    // given
    setupMockTranslator(enMessages.email);

    // when
    const { subject } = await renderManageLinkEmail(defaultParams);

    // then
    expect(subject).toBe("Your Registration Manage Link");
  });

  test("should default to English locale when locale is not provided", async () => {
    // given
    setupMockTranslator(enMessages.email);

    // when
    await renderManageLinkEmail(defaultParams);

    // then
    expect(mockGetTranslations).toHaveBeenCalledWith({
      locale: "en",
      namespace: "email",
    });
  });

  test("should use provided locale for translations", async () => {
    // given
    setupMockTranslator(csMessages.email);

    // when
    await renderManageLinkEmail({ ...defaultParams, locale: "cs" });

    // then
    expect(mockGetTranslations).toHaveBeenCalledWith({
      locale: "cs",
      namespace: "email",
    });
  });

  // --- Locale-specific rendering tests ---

  test("should render English email with correct translated strings", async () => {
    // given
    setupMockTranslator(enMessages.email);

    // when
    const { subject, html } = await renderManageLinkEmail({
      ...defaultParams,
      locale: "en",
    });

    // then
    expect(subject).toBe("Your Registration Manage Link");
    expect(html).toContain("Hi Alice Johnson,");
    expect(html).toContain("Thank you for registering");
    expect(html).toContain("Triple threat");
    expect(html).toContain("Saturday, June 6, 2026");
    expect(html).toContain("Use the button below");
    expect(html).toContain("Manage Registration");
    expect(html).toContain("copy and paste this link");
    expect(html).toContain("A calendar invite is attached");
    expect(html).toContain("automated message");
  });

  test("should render Czech email with correct translated strings", async () => {
    // given
    setupMockTranslator(csMessages.email);

    // when
    const { subject, html } = await renderManageLinkEmail({
      ...defaultParams,
      locale: "cs",
    });

    // then
    expect(subject).toBe("Odkaz pro správu vaší registrace");
    expect(html).toContain("Dobrý den, Alice Johnson,");
    expect(html).toContain("Děkujeme za registraci");
    expect(html).toContain("Triple threat");
    expect(html).toContain("Sobota 6. června 2026");
    expect(html).toContain("Pomocí tlačítka níže");
    expect(html).toContain("Spravovat registraci");
    expect(html).toContain("zkopírujte a vložte tento odkaz");
    expect(html).toContain("přiložena pozvánka do kalendáře");
    expect(html).toContain("automatická zpráva");
  });

  test("should render Slovak email with correct translated strings", async () => {
    // given
    setupMockTranslator(skMessages.email);

    // when
    const { subject, html } = await renderManageLinkEmail({
      ...defaultParams,
      locale: "sk",
    });

    // then
    expect(subject).toBe("Odkaz na správu vašej registrácie");
    expect(html).toContain("Dobrý deň, Alice Johnson,");
    expect(html).toContain("Ďakujeme za registráciu");
    expect(html).toContain("Triple threat");
    expect(html).toContain("Sobota 6. júna 2026");
    expect(html).toContain("Pomocou tlačidla nižšie");
    expect(html).toContain("Spravovať registráciu");
    expect(html).toContain("skopírujte a vložte tento odkaz");
    expect(html).toContain("priložená pozvánka do kalendára");
    expect(html).toContain("automatická správa");
  });

  // --- B-004 regression: bold formatting for event name and date ---

  test("should render event name wrapped in <strong> tags in the HTML body", async () => {
    // given
    setupMockTranslator(enMessages.email);

    // when
    const { html } = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("<strong>Triple threat</strong>");
  });

  test("should render event date wrapped in <strong> tags in the HTML body", async () => {
    // given
    setupMockTranslator(enMessages.email);

    // when
    const { html } = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("<strong>Saturday, June 6, 2026</strong>");
  });

  test("should not contain literal ICU tag syntax in rendered thankYou text", async () => {
    // given
    // - ensures translation strings don't contain <strong> as ICU tags
    setupMockTranslator(enMessages.email);

    // when
    const { html } = await renderManageLinkEmail(defaultParams);

    // then
    // The thankYou paragraph should not contain escaped HTML entities from tags
    // (which would indicate the translation string itself had HTML that got escaped)
    expect(html).not.toContain("&lt;strong&gt;");
  });

  test("should escape HTML in event name even when wrapped in bold tags", async () => {
    // given
    const maliciousMessages = {
      ...enMessages.email,
      eventName: 'Party & "Fun" <Night>',
    };
    setupMockTranslator(maliciousMessages);

    // when
    const { html } = await renderManageLinkEmail(defaultParams);

    // then
    expect(html).toContain("<strong>Party &amp; &quot;Fun&quot; &lt;Night&gt;</strong>");
  });

  test("should keep manage URL language-independent across locales", async () => {
    // given
    const url = "https://example.com/manage?token=test-token-12345678";

    // when
    setupMockTranslator(enMessages.email);
    const enResult = await renderManageLinkEmail({ ...defaultParams, locale: "en" });

    setupMockTranslator(csMessages.email);
    const csResult = await renderManageLinkEmail({ ...defaultParams, locale: "cs" });

    setupMockTranslator(skMessages.email);
    const skResult = await renderManageLinkEmail({ ...defaultParams, locale: "sk" });

    // then
    for (const { html } of [enResult, csResult, skResult]) {
      expect(html).toContain(`<a href="${url}"`);
      expect(html).toContain(`>${url}</a>`);
    }
  });

  test("should set html lang attribute to the locale", async () => {
    // given
    setupMockTranslator(csMessages.email);

    // when
    const { html } = await renderManageLinkEmail({
      ...defaultParams,
      locale: "cs",
    });

    // then
    expect(html).toContain('<html lang="cs">');
  });
});
