import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Platform, useColorScheme } from 'react-native';
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
  // Light was the default, which meant every new install landed in the theme
  // this app was NOT designed in: the near-black surfaces, the ambient glow
  // and the 99-grid were all built dark, and on white the progress ring at 0%
  // is barely a shape. Following the phone instead means most people see the
  // version the app was drawn for without anyone imposing a choice on them.
  const system = useColorScheme();
  const [chosen, setChosen] = useState<ThemeMode | null>(null);

  useEffect(() => {
    storage.getThemeMode().then(setChosen);
  }, []);

  // Until the store answers, follow the system rather than guessing: the HTML
  // shell already painted the background from the same signal, so the two
  // agree and there's no flash. A stored choice always wins once it arrives.
  const mode: ThemeMode = chosen ?? (system === 'dark' ? 'dark' : 'light');

  const setMode = useCallback((next: ThemeMode) => {
    setChosen(next);
    storage.setThemeMode(next);
  }, []);

  // Reads `mode`, not the stored value: before anyone has chosen, the switch
  // has to flip away from what's actually on screen, which is the system's.
  const toggleTheme = useCallback(() => {
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setChosen(next);
    storage.setThemeMode(next);
  }, [mode]);

  const colors = mode === 'dark' ? darkColors : lightColors;
  const typography = useMemo(() => getTypography(colors), [colors]);

  // The static HTML shell (public/index.html) paints the background from the
  // OS color scheme so there's no flash before React mounts. The two now
  // agree by default, but they still diverge the moment someone picks a
  // theme the phone disagrees with — so keep html/body/#root on the ACTUAL
  // current theme, or a gap below the app content (e.g. from an
  // under-measured viewport height in iOS Safari standalone) shows the
  // wrong colour.
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
