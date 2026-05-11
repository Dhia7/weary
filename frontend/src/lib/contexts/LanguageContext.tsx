'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  isFrench: boolean;
}

const LANGUAGE_STORAGE_KEY = 'language';
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setMounted(true);
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    if (savedLanguage === 'en' || savedLanguage === 'fr') {
      setLanguageState(savedLanguage);
      document.documentElement.lang = savedLanguage;
    } else {
      setLanguageState('fr');
      document.documentElement.lang = 'fr';
    }
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language, mounted]);

  const value = useMemo(
    () => ({
      language,
      isFrench: language === 'fr',
      setLanguage: setLanguageState,
      toggleLanguage: () => setLanguageState((prev) => (prev === 'en' ? 'fr' : 'en')),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    return {
      language: 'fr' as Language,
      setLanguage: () => {},
      toggleLanguage: () => {},
      isFrench: true,
    };
  }
  return context;
}
