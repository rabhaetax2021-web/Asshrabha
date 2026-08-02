import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ar';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const rawLocale = String(cookieStore.get('NEXT_LOCALE')?.value || '').trim().toLowerCase().split('-')[0]
  const locale = (rawLocale === 'ar' || rawLocale === 'en' ? rawLocale : defaultLocale) as Locale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
