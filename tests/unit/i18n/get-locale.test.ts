import { describe, test, expect } from "vitest";
import { detectLocale, LOCALE_COOKIE } from "@/i18n/get-locale";

describe("detectLocale", () => {
  test("should return default locale when no inputs provided", () => {
    // given
    // - no cookie, no accept-language

    // when
    const result = detectLocale({});

    // then
    expect(result).toBe("en");
  });

  test("should use cookie locale when valid", () => {
    // given
    // - cookie set to cs

    // when
    const result = detectLocale({ cookieLocale: "cs" });

    // then
    expect(result).toBe("cs");
  });

  test("should ignore invalid cookie locale and fall back to accept-language", () => {
    // given
    // - invalid cookie, valid accept-language

    // when
    const result = detectLocale({
      cookieLocale: "de",
      acceptLanguage: "sk,en;q=0.5",
    });

    // then
    expect(result).toBe("sk");
  });

  test("should detect exact match from accept-language", () => {
    // given
    const acceptLanguage = "cs,en;q=0.8";

    // when
    const result = detectLocale({ acceptLanguage });

    // then
    expect(result).toBe("cs");
  });

  test("should detect language prefix match from accept-language (cs-CZ → cs)", () => {
    // given
    const acceptLanguage = "cs-CZ,en;q=0.5";

    // when
    const result = detectLocale({ acceptLanguage });

    // then
    expect(result).toBe("cs");
  });

  test("should detect sk from sk-SK accept-language", () => {
    // given
    const acceptLanguage = "sk-SK,sk;q=0.9,en;q=0.5";

    // when
    const result = detectLocale({ acceptLanguage });

    // then
    expect(result).toBe("sk");
  });

  test("should respect quality values and pick highest supported", () => {
    // given
    // - de has highest q but is unsupported, sk next
    const acceptLanguage = "de;q=1.0,sk;q=0.9,en;q=0.5";

    // when
    const result = detectLocale({ acceptLanguage });

    // then
    expect(result).toBe("sk");
  });

  test("should fall back to default when no supported language in accept-language", () => {
    // given
    const acceptLanguage = "de,fr;q=0.9,ja;q=0.5";

    // when
    const result = detectLocale({ acceptLanguage });

    // then
    expect(result).toBe("en");
  });

  test("should cookie take priority over accept-language", () => {
    // given
    // - cookie is sk, accept-language prefers cs

    // when
    const result = detectLocale({
      cookieLocale: "sk",
      acceptLanguage: "cs,en;q=0.5",
    });

    // then
    expect(result).toBe("sk");
  });

  test("should export LOCALE_COOKIE constant", () => {
    expect(LOCALE_COOKIE).toBe("NEXT_LOCALE");
  });
});
