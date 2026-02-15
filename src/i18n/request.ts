import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { detectLocale, LOCALE_COOKIE } from './get-locale';
import { defaultLocale } from './config';

export default getRequestConfig(async () => {
  let cookieLocale: string | undefined;
  let acceptLanguage: string | undefined;

  try {
    const cookieStore = await cookies();
    const headerStore = await headers();
    cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
    acceptLanguage = headerStore.get('accept-language') ?? undefined;
  } catch {
    // During static prerender (e.g. /_not-found), cookies()/headers() throw.
    // Fall back to default locale.
  }

  const locale = detectLocale({ cookieLocale, acceptLanguage });

  let messages: Record<string, string>;
  try {
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`./messages/${defaultLocale}.json`)).default;
  }

  return {
    locale,
    messages,
  };
});
