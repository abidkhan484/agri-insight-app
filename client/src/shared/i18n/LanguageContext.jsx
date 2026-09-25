import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LANGUAGE_STORAGE_KEY = 'agri-insight-language';
const translations = {
  bn: { languageLabel: 'ভাষা', bangla: 'বাংলা', english: 'English', appName: 'কৃষি সহকারী', loading: 'কৃষি সহকারী লোড হচ্ছে...', backHome: 'হোমে ফিরুন', languageSwitched: 'ভাষা পরিবর্তন হয়েছে' },
  en: { languageLabel: 'Language', bangla: 'বাংলা', english: 'English', appName: 'Agriculture Assistant', loading: 'Agriculture Assistant is loading...', backHome: 'Back home', languageSwitched: 'Language changed' },
};

function getInitialLanguage() {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'bn' || stored === 'en') return stored;
  } catch { /* Embedded webviews may block storage. */ }
  return 'bn';
}

export const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
    document.body.classList.toggle('language-bn', language === 'bn');
    document.body.classList.toggle('language-en', language === 'en');
    try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language); } catch { /* Session-only fallback. */ }
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key) => translations[language][key] || key, isBangla: language === 'bn' }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context) return context;
  return { language: 'bn', setLanguage: () => {}, t: (key) => translations.bn[key] || key, isBangla: true };
}

export function LanguageText({ bn, en }) {
  const { isBangla } = useLanguage();
  return isBangla ? bn : en;
}

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="language-switcher" role="group" aria-label={t('languageLabel')}>
      <span className="language-switcher-label">{t('languageLabel')}:</span>
      <button type="button" className={language === 'bn' ? 'active' : ''} aria-pressed={language === 'bn'} onClick={() => setLanguage('bn')}>{t('bangla')}</button>
      <span aria-hidden="true">/</span>
      <button type="button" className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>{t('english')}</button>
      <span className="sr-only" role="status" aria-live="polite">{t('languageSwitched')}</span>
    </div>
  );
}
