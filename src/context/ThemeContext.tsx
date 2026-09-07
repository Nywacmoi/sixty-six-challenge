import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
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

  const value: ThemeContextValue = { mode, colors, typography, toggleTheme, setMode };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
