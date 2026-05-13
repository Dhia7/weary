'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

export type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  isFrench: boolean;
}

const LANGUAGE_STORAGE_KEY = 'language';
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const languageListeners = new Set<() => void>();
let languageStoreHydrated = false;

function subscribe(listener: () => void) {
  languageListeners.add(listener);
  return () => {
    languageListeners.delete(listener);
  };
}

function notifyLanguageListeners() {
  languageListeners.forEach((listener) => listener());
}

function readStoredLanguage(fallback: Language): Language {
  if (typeof window === 'undefined') return fallback;
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'en' || stored === 'fr') return stored;
  return fallback;
}

function persistLanguage(language: Language) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  document.documentElement.lang = language;
  document.cookie = `${LANGUAGE_STORAGE_KEY}=${language};path=/;max-age=31536000;SameSite=Lax`;
}

function getClientLanguageSnapshot(serverLanguage: Language): Language {
  if (!languageStoreHydrated) return serverLanguage;
  return readStoredLanguage(serverLanguage);
}

export function LanguageProvider({
  children,
  initialLanguage = 'fr',
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const language = useSyncExternalStore(
    subscribe,
    () => getClientLanguageSnapshot(initialLanguage),
    () => initialLanguage
  );

  useLayoutEffect(() => {
    languageStoreHydrated = true;
    const stored = readStoredLanguage(initialLanguage);
    if (!localStorage.getItem(LANGUAGE_STORAGE_KEY)) {
      persistLanguage(initialLanguage);
    } else if (stored !== initialLanguage) {
      persistLanguage(stored);
    }
    notifyLanguageListeners();
  }, [initialLanguage]);

  const setLanguage = useCallback((next: Language) => {
    persistLanguage(next);
    notifyLanguageListeners();
  }, []);

  const value = useMemo(
    () => ({
      language,
      isFrench: language === 'fr',
      setLanguage,
      toggleLanguage: () => setLanguage(language === 'en' ? 'fr' : 'en'),
    }),
    [language, setLanguage]
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
