import { createContext, useContext, useState, useCallback } from 'react';
import { translations, LANGUAGES, DEFAULT_LANGUAGE } from '../i18n/translations.js';

const LANG_KEY = 'alfa9_lang';

const LanguageContext = createContext(null);

function readSavedLanguage() {
  const saved = localStorage.getItem(LANG_KEY);
  return LANGUAGES.some((l) => l.code === saved) ? saved : DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readSavedLanguage);

  const setLanguage = useCallback((code) => {
    if (!LANGUAGES.some((l) => l.code === code)) return;
    localStorage.setItem(LANG_KEY, code);
    setLanguageState(code);
  }, []);

  // t('key') looks up the current language's translation, falling back to
  // English if a key hasn't been translated yet for that language, and
  // finally to the key itself so a missing string never renders blank.
  const t = useCallback(
    (key) => translations[language]?.[key] ?? translations[DEFAULT_LANGUAGE]?.[key] ?? key,
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}