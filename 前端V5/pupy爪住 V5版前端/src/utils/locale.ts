export type AppLocale = 'zh-CN' | 'en-US';

export const LOCALE_STORAGE_KEY = 'pupy_locale';
export const DEFAULT_LOCALE: AppLocale = 'zh-CN';

export const localeOptions: Array<{ value: AppLocale; label: string; description: string }> = [
  { value: 'zh-CN', label: '中文', description: '默认语言，优先展示中文界面和中文接口语义。' },
  { value: 'en-US', label: 'English', description: '备用语言，用于英文界面与英文提示。' },
];

export function getStoredLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return value === 'en-US' ? 'en-US' : DEFAULT_LOCALE;
}

export function setStoredLocale(locale: AppLocale) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}
