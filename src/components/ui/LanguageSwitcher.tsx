"use client";

import { useLocale } from "next-intl";
import { locales } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { LOCALE_COOKIE } from "@/i18n/get-locale";

const localeLabels: Record<Locale, string> = {
  en: "EN",
  cs: "CS",
  sk: "SK",
};

export function LanguageSwitcher(): React.ReactElement {
  const currentLocale = useLocale();

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
