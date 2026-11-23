import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translations from '../locales';
import { STORAGE_KEYS } from '../constants/storage';

const SUPPORTED_LANGUAGES = ['en', 'es', 'pt'] as const;

/**
 * A saved choice always wins. Without one, the first browser language the app speaks, read
 * by its base tag (`pt-BR` is `pt`); English when none match. Starting everyone in
 * Portuguese greeted most first-time visitors in a language they had not picked.
 */
export function initialLanguage(saved: string | null, browserLanguages: readonly string[]): string {
  if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) return saved;
  for (const tag of browserLanguages) {
    const base = tag.toLowerCase().split('-')[0];
    if ((SUPPORTED_LANGUAGES as readonly string[]).includes(base)) return base;
  }
  return 'en';
}

const readSavedLanguage = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.language);
  } catch {
    return null;
  }
};

const browserLanguages =
  typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language];

const savedLanguage = initialLanguage(readSavedLanguage(), browserLanguages);

i18n
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    lng: savedLanguage,
    fallbackLng: 'en',
    resources: translations,
    defaultNS: 'translations',
    interpolation: {
      // React already escapes rendered strings; i18next's own HTML-escaping
      // would show card/deck names like "A // B" as "A &#x2F;&#x2F; B".
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEYS.language, lng);
});

export default i18n;
