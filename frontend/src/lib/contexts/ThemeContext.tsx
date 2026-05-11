'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme';

function applyThemeClass(next: Theme) {
  if (typeof window === 'undefined') return;
  document.documentElement.classList.toggle('dark', next === 'dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    // Project default: light. Only override if user explicitly saved a preference.
    const initial: Theme = stored === 'light' || stored === 'dark' ? stored : 'light';

    setTheme(initial);
    applyThemeClass(initial);
  }, []);

  const setThemeAndPersist = useCallback((next: Theme) => {
    setTheme(next);
    applyThemeClass(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeAndPersist(theme === 'dark' ? 'light' : 'dark');
  }, [setThemeAndPersist, theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme: setThemeAndPersist,
    }),
    [setThemeAndPersist, theme, toggleTheme],
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
    // Return a default context during SSR
    return {
      theme: 'light' as Theme,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
}
