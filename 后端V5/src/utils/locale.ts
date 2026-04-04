import type { Request } from 'express';

export type BackendLocale = 'zh-CN' | 'en-US';

export function resolveRequestLocale(req: Request): BackendLocale {
  const acceptLanguage = req.headers['accept-language'];
  if (typeof acceptLanguage === 'string' && acceptLanguage.toLowerCase().startsWith('en')) {
    return 'en-US';
  }

  return 'zh-CN';
}

export function pickLocaleText(locale: BackendLocale, zhCN: string, enUS: string): string {
  return locale === 'en-US' ? enUS : zhCN;
}
