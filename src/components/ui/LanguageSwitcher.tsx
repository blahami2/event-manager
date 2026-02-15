"use client";

import { useState } from "react";
import { locales, defaultLocale } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { LOCALE_COOKIE } from "@/i18n/get-locale";

const localeLabels: Record<Locale, string> = {
  en: "EN",
  cs: "CS",
  sk: "SK",
};

/**
 * Read current locale from the NEXT_LOCALE cookie on the client.
 * Falls back to defaultLocale if not set.
 */
function getLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return defaultLocale;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match?.[1];
  return value && (locales as readonly string[]).includes(value)
    ? (value as Locale)
    : defaultLocale;
}

export function LanguageSwitcher(): React.ReactElement {
  const [currentLocale] = useState<Locale>(() => getLocaleFromCookie());

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const newLocale = e.target.value;
    document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;max-age=31536000`;
    window.location.reload();
  }

  return (
    <select
      value={currentLocale}
      onChange={handleChange}
      aria-label="Select language"
      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {localeLabels[locale]}
        </option>
      ))}
    </select>
  );
}
