import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { THEMES, type ThemeName } from '../lib/theme-config';

type Mode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
  effectiveMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    // Check for old schema (migration)
    const oldTheme = localStorage.getItem('theme');
    const storedMode = localStorage.getItem('mode');

    if (oldTheme && !storedMode) {
      // Migrate old schema
      localStorage.setItem('mode', oldTheme);
      localStorage.removeItem('theme');
      return oldTheme as Mode;
    }

    return (storedMode as Mode) || 'system';
  });

  const [themeName, setThemeName] = useState<ThemeName>(() => {
    const stored = localStorage.getItem('themeName');
    return (stored as ThemeName) || 'default';
  });

  const [effectiveMode, setEffectiveMode] = useState<'light' | 'dark'>('dark');

  // Load theme-specific fonts
  useEffect(() => {
    const theme = THEMES.find((t) => t.name === themeName);
    if (!theme?.fonts?.length) return;

    theme.fonts.forEach((fontFamily) => {
      const linkId = `font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
      if (document.getElementById(linkId)) return; // already loaded

      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(
        /\s+/g,
        '+'
      )}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);
    });
  }, [themeName]);

  // Apply mode and theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove both classes first
    root.classList.remove('light', 'dark');

    let finalMode: 'light' | 'dark';

    if (mode === 'system') {
      // Check system preference
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      finalMode = systemPrefersDark ? 'dark' : 'light';
    } else {
      finalMode = mode;
    }

    // Apply the mode class
    root.classList.add(finalMode);
    setEffectiveMode(finalMode);

    // Apply theme data attribute (skip for default theme)
    if (themeName === 'default') {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = themeName;
    }

    // Save to localStorage
    localStorage.setItem('mode', mode);
    localStorage.setItem('themeName', themeName);
  }, [mode, themeName]);

  // Listen to system theme changes when in 'system' mode
  useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      const newMode = e.matches ? 'dark' : 'light';

      root.classList.remove('light', 'dark');
      root.classList.add(newMode);
      setEffectiveMode(newMode);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  return (
    <ThemeContext.Provider
      value={{ mode, setMode, themeName, setThemeName, effectiveMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
