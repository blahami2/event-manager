"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Locale } from "@/i18n/config";
import { LOCALE_COOKIE } from "@/i18n/get-locale";

interface LanguageOption {
  readonly locale: Locale;
  readonly label: string;
  readonly flag: string;
}

const LANGUAGES: ReadonlyArray<LanguageOption> = [
  { locale: "en", label: "English", flag: "🇬🇧" },
  { locale: "cs", label: "Čeština", flag: "🇨🇿" },
  { locale: "sk", label: "Slovenčina", flag: "🇸🇰" },
] as const;

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`)
  );
  return match?.[1];
}

function getInitialLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const cookieVal = getCookie(LOCALE_COOKIE);
  if (cookieVal === "cs" || cookieVal === "sk" || cookieVal === "en") {
    return cookieVal;
  }
  return "en";
}

export function LanguageSwitcher(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale] = useState<Locale>(getInitialLocale);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback((locale: Locale): void => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000`;
    setIsOpen(false);
    window.location.reload();
  }, []);

  // Default to English (first entry); non-null assertion safe since LANGUAGES is a static non-empty array
  const current: LanguageOption =
    LANGUAGES.find((l) => l.locale === currentLocale) ??
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    LANGUAGES[0]!;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          className="absolute right-0 z-50 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
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
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-indigo-50 ${
                lang.locale === currentLocale
                  ? "bg-indigo-50 font-medium text-indigo-700"
                  : "text-gray-700"
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
