import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import fr from './fr.json';
import mg from './mg.json';

export const LANGUAGES = ['fr', 'mg', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

const deviceLanguage = (): Language => {
  const code = getLocales()[0]?.languageCode;
  return LANGUAGES.includes(code as Language) ? (code as Language) : 'fr';
};

const i18n = createInstance();

// Traductions embarquées : aucun chargement réseau.
export function initI18n(saved?: string | null) {
  if (i18n.isInitialized) return i18n;
  void i18n.use(initReactI18next).init({
    resources: { fr: { translation: fr }, mg: { translation: mg }, en: { translation: en } },
    lng: LANGUAGES.includes(saved as Language) ? (saved as Language) : deviceLanguage(),
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
    initAsync: false,
  });
  return i18n;
}

export default i18n;
