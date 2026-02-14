import { defaultLocale, isValidLocale } from './config';
import type { Locale } from './config';

export const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Detect locale from Accept-Language header.
 * Fallback chain: cookie override → exact match → language prefix match → default.
 */
export function detectLocale(options: {
  readonly cookieLocale?: string;
  readonly acceptLanguage?: string;
}): Locale {
  const { cookieLocale, acceptLanguage } = options;

  // 1. Cookie override takes priority
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Parse Accept-Language header
  if (acceptLanguage) {
    const parsed = parseAcceptLanguage(acceptLanguage);
    for (const tag of parsed) {
      // Exact match
      if (isValidLocale(tag)) {
        return tag;
      }
      // Language prefix match (e.g., 'cs-CZ' → 'cs')
      const prefix = tag.split('-')[0];
      if (prefix && isValidLocale(prefix)) {
        return prefix;
      }
    }
  }

  // 3. Default fallback
  return defaultLocale;
}

/**
 * Parse Accept-Language header into sorted list of language tags.
 * Example: "cs-CZ,cs;q=0.9,en;q=0.8" → ["cs-CZ", "cs", "en"]
 */
function parseAcceptLanguage(header: string): ReadonlyArray<string> {
  return header
    .split(',')
    .map((part) => {
      const [tag, quality] = part.trim().split(';');
      const q = quality ? parseFloat(quality.replace('q=', '')) : 1;
      return { tag: tag?.trim().toLowerCase() ?? '', q: isNaN(q) ? 0 : q };
    })
    .filter(({ tag }) => tag.length > 0)
    .sort((a, b) => b.q - a.q)
    .map(({ tag }) => tag);
}
