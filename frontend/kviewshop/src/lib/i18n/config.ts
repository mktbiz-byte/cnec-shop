export const locales = ['en', 'ja', 'ko', 'es', 'it', 'ru', 'ar', 'zh', 'fr', 'pt', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  it: 'Italiano',
  ru: 'Русский',
  ar: 'العربية',
  zh: '中文',
  fr: 'Français',
  pt: 'Português',
  de: 'Deutsch',
};

export const localeCurrencies: Record<Locale, string> = {
  en: 'USD',
  ja: 'JPY',
  ko: 'KRW',
  es: 'EUR',
  it: 'EUR',
  ru: 'RUB',
  ar: 'AED',
  zh: 'CNY',
  fr: 'EUR',
  pt: 'BRL',
  de: 'EUR',
};

export const localeCountries: Record<Locale, string> = {
  en: 'US',
  ja: 'JP',
  ko: 'KR',
  es: 'ES',
  it: 'IT',
  ru: 'RU',
  ar: 'AE',
  zh: 'CN',
  fr: 'FR',
  pt: 'BR',
  de: 'DE',
};

// Generate locale pattern for regex (used in middleware)
export const localePattern = locales.join('|');

export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/');
  const locale = segments[1] as Locale;
  return locales.includes(locale) ? locale : defaultLocale;
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocaleIntl(locale: Locale): string {
  const map: Record<Locale, string> = {
    en: 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR',
    es: 'es-ES',
    it: 'it-IT',
    ru: 'ru-RU',
    ar: 'ar-AE',
    zh: 'zh-CN',
    fr: 'fr-FR',
    pt: 'pt-BR',
    de: 'de-DE',
  };
  return map[locale] || 'en-US';
}

export function formatCurrency(
  amount: number,
  currency: string
): string {
  const localeMap: Record<string, string> = {
    USD: 'en-US', JPY: 'ja-JP', KRW: 'ko-KR', EUR: 'en-US',
    RUB: 'ru-RU', AED: 'ar-AE', CNY: 'zh-CN', BRL: 'pt-BR',
  };
  const noCents = ['JPY', 'KRW', 'RUB', 'CNY'];
  const formatter = new Intl.NumberFormat(localeMap[currency] || 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: noCents.includes(currency) ? 0 : 2,
    maximumFractionDigits: noCents.includes(currency) ? 0 : 2,
  });
  return formatter.format(amount);
}

export function formatNumber(amount: number, locale: Locale): string {
  const formatter = new Intl.NumberFormat(getLocaleIntl(locale));
  return formatter.format(amount);
}

export function formatDate(date: string | Date, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat(getLocaleIntl(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return formatter.format(d);
}

export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}
