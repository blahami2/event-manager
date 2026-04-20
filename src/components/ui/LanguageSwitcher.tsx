"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { locales, defaultLocale } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { LOCALE_COOKIE } from "@/i18n/get-locale";

interface LanguageOption {
  locale: Locale;
  label: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { locale: "en", label: "English", flag: "🇬🇧" },
  { locale: "cs", label: "Čeština", flag: "🇨🇿" },
  { locale: "sk", label: "Slovenčina", flag: "🇸🇰" },
];

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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.locale === currentLocale) as LanguageOption;

  const handleSelect = useCallback((locale: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000`;
    window.location.reload();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface-raised/70 px-2.5 py-1.5 text-sm text-text-primary backdrop-blur-sm transition-colors duration-150 hover:border-border-strong hover:bg-surface-raised focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
      >
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg
          className={`ml-1 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="Available languages"
          className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-md border border-border-default bg-surface-overlay py-1 shadow-pop admin-pop-in"
        >
          {LANGUAGES.map((lang) => (
            <li
              key={lang.locale}
              role="option"
              aria-selected={lang.locale === currentLocale}
              onClick={() => handleSelect(lang.locale)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(lang.locale);
                }
              }}
              tabIndex={0}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors duration-100 hover:bg-admin-hover ${
                lang.locale === currentLocale
                  ? "bg-admin-hover font-medium text-accent"
                  : "text-text-primary"
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
