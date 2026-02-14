export const locales = ['en', 'cs', 'sk'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

export function isValidLocale(value: string): value is Locale {
  return (locales as ReadonlyArray<string>).includes(value);
}
