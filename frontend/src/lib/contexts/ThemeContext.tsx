'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: 'light';
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme';

function forceLight() {
  if (typeof window === 'undefined') return;
  document.documentElement.classList.remove('dark');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useIsomorphicLayoutEffect(() => {
    forceLight();
  }, []);

  const noop = useCallback(() => {}, []);

  const setTheme = useCallback((next: Theme) => {
    if (next !== 'light') return;
    forceLight();
  }, []);

  const value = useMemo(
    () => ({
      theme: 'light' as const,
      toggleTheme: noop,
      setTheme,
    }),
    [noop, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      theme: 'light' as const,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
}
