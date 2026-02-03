export const locales = ['en', 'ja', 'ko'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};

export const localeCurrencies: Record<Locale, 'USD' | 'JPY' | 'KRW'> = {
  en: 'USD',
  ja: 'JPY',
  ko: 'KRW',
};

export const localeCountries: Record<Locale, 'US' | 'JP' | 'KR'> = {
  en: 'US',
  ja: 'JP',
  ko: 'KR',
};

export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/');
  const locale = segments[1] as Locale;
  return locales.includes(locale) ? locale : defaultLocale;
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function formatCurrency(
  amount: number,
  currency: 'USD' | 'JPY' | 'KRW'
): string {
  const formatter = new Intl.NumberFormat(
    currency === 'USD' ? 'en-US' : currency === 'JPY' ? 'ja-JP' : 'ko-KR',
    {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
    }
  );
  return formatter.format(amount);
}

export function formatNumber(amount: number, locale: Locale): string {
  const formatter = new Intl.NumberFormat(
    locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : 'ko-KR'
  );
  return formatter.format(amount);
}

export function formatDate(date: string | Date, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat(
    locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : 'ko-KR',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );
  return formatter.format(d);
}
