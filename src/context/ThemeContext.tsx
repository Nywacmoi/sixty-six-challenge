import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { lightColors, darkColors, getTypography, ThemeColors, Typography } from '../theme/theme';
import { storage } from '../storage/storage';

type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: Typography;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    storage.getThemeMode().then(setModeState);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    storage.setThemeMode(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      storage.setThemeMode(next);
      return next;
    });
  }, []);

  const colors = mode === 'dark' ? darkColors : lightColors;
  const typography = useMemo(() => getTypography(colors), [colors]);

  // The static HTML shell (public/index.html) guesses the background from
  // the OS color scheme so there's no white flash before React mounts, but
  // the app's theme is a stored preference independent of the OS setting —
  // this keeps html/body/#root in sync with the ACTUAL current theme so a
  // gap below the app content (e.g. from an under-measured viewport height
  // on some iOS Safari standalone sessions) blends in instead of showing
  // the wrong color when the two disagree.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.style.backgroundColor = colors.background;
    document.body.style.backgroundColor = colors.background;
    const root = document.getElementById('root');
    if (root) root.style.backgroundColor = colors.background;
  }, [colors.background]);

  const value: ThemeContextValue = { mode, colors, typography, toggleTheme, setMode };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
