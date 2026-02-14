import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { detectLocale, LOCALE_COOKIE } from './get-locale';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const acceptLanguage = headerStore.get('accept-language') ?? undefined;

  const locale = detectLocale({ cookieLocale, acceptLanguage });

  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
