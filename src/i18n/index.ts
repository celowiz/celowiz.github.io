import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import pt from './pt.json';
import en from './en.json';

const STORAGE_KEY = 'preferredLanguage';

function detectLanguage(): 'pt' | 'en' {
  if (typeof window === 'undefined') return 'pt';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'pt') return stored;
  } catch {
    // ignore unavailable storage
  }

  const nav = (navigator.language || navigator.languages?.[0] || '').toLowerCase();
  if (nav.startsWith('en')) return 'en';
  return 'pt';
}

function applyHtmlLang(lng: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lng.startsWith('en') ? 'en' : 'pt';
}

const initialLng = detectLanguage();

try {
  if (typeof localStorage !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, initialLng);
  }
} catch {
  // ignore unavailable storage
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    lng: initialLng,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
  });

applyHtmlLang(initialLng);

i18n.on('languageChanged', (lng) => {
  const normalized = lng.startsWith('en') ? 'en' : 'pt';
  applyHtmlLang(normalized);
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // ignore unavailable storage
  }
});

export default i18n;
