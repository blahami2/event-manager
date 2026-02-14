import { describe, test, expect } from "vitest";
import { locales, defaultLocale, isValidLocale } from "@/i18n/config";

describe("i18n config", () => {
  test("should export en, cs, sk as supported locales", () => {
    expect(locales).toEqual(["en", "cs", "sk"]);
  });

  test("should have en as default locale", () => {
    expect(defaultLocale).toBe("en");
  });

  test("should validate supported locales", () => {
    expect(isValidLocale("en")).toBe(true);
    expect(isValidLocale("cs")).toBe(true);
    expect(isValidLocale("sk")).toBe(true);
  });

  test("should reject unsupported locales", () => {
    expect(isValidLocale("de")).toBe(false);
    expect(isValidLocale("fr")).toBe(false);
    expect(isValidLocale("")).toBe(false);
    expect(isValidLocale("en-US")).toBe(false);
  });
});
