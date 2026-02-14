import { describe, test, expect } from "vitest";
import en from "@/i18n/messages/en.json";
import cs from "@/i18n/messages/cs.json";
import sk from "@/i18n/messages/sk.json";

/**
 * Recursively extract all keys from a nested object as dot-separated paths.
 */
function extractKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

describe("i18n message files", () => {
  const enKeys = extractKeys(en);
  const csKeys = extractKeys(cs);
  const skKeys = extractKeys(sk);

  test("should have identical key sets across all locales (I18N5)", () => {
    // then
    expect(csKeys).toEqual(enKeys);
    expect(skKeys).toEqual(enKeys);
  });

  test("should have non-empty string values for all keys in en.json", () => {
    for (const key of enKeys) {
      const value = key.split(".").reduce<unknown>((obj, k) => (obj as Record<string, unknown>)?.[k], en);
      expect(value, `en.${key} should be a non-empty string`).toBeTruthy();
      expect(typeof value, `en.${key} should be string`).toBe("string");
    }
  });

  test("should have non-empty string values for all keys in cs.json", () => {
    for (const key of csKeys) {
      const value = key.split(".").reduce<unknown>((obj, k) => (obj as Record<string, unknown>)?.[k], cs);
      expect(value, `cs.${key} should be a non-empty string`).toBeTruthy();
      expect(typeof value, `cs.${key} should be string`).toBe("string");
    }
  });

  test("should have non-empty string values for all keys in sk.json", () => {
    for (const key of skKeys) {
      const value = key.split(".").reduce<unknown>((obj, k) => (obj as Record<string, unknown>)?.[k], sk);
      expect(value, `sk.${key} should be a non-empty string`).toBeTruthy();
      expect(typeof value, `sk.${key} should be string`).toBe("string");
    }
  });

  test("should have at least common, nav, errors, form namespaces", () => {
    const topKeys = Object.keys(en);
    expect(topKeys).toContain("common");
    expect(topKeys).toContain("nav");
    expect(topKeys).toContain("errors");
    expect(topKeys).toContain("form");
  });
});
