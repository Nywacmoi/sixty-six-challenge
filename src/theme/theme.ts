export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  accent: string;
  accentDim: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  success: string;
  danger: string;
  gold: string;
};

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F6F6F8',
  surfaceElevated: '#ECECF0',
  border: '#E3E3E8',
  accent: '#005FFE',
  accentDim: '#D6E4FF',
  text: '#111114',
  textSecondary: '#6B6B72',
  textTertiary: '#A0A0A8',
  success: '#2FAE4C',
  danger: '#E63946',
  gold: '#B8860B',
};

export const darkColors: ThemeColors = {
  background: '#0B0B0D',
  surface: '#17171A',
  surfaceElevated: '#202024',
  border: '#2A2A2E',
  accent: '#3D8BFF',
  accentDim: '#0D2B5C',
  text: '#F5F5F0',
  textSecondary: '#9B9B9F',
  textTertiary: '#5C5C60',
  success: '#3ECF5B',
  danger: '#FF4D4D',
  gold: '#FFC542',
};

// The monospace "dashboard readout" font from the Aujourd'hui banner,
// applied to the whole app's typography for a consistent look.
export const fonts = {
  display: 'SpaceMono_700Bold',
  regular: 'SpaceMono_400Regular',
  medium: 'SpaceMono_400Regular',
  semiBold: 'SpaceMono_700Bold',
  bold: 'SpaceMono_700Bold',
  extraBold: 'SpaceMono_700Bold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
};

export function getTypography(colors: ThemeColors) {
  return {
    display: { fontSize: 36, fontFamily: fonts.display, color: colors.text, letterSpacing: 0.4 },
    h1: { fontSize: 26, fontFamily: fonts.display, color: colors.text, letterSpacing: 0.3 },
    h2: { fontSize: 18, fontFamily: fonts.bold, color: colors.text },
    body: { fontSize: 15, fontFamily: fonts.regular, color: colors.text },
    bodyBold: { fontSize: 15, fontFamily: fonts.semiBold, color: colors.text },
    caption: { fontSize: 12, fontFamily: fonts.semiBold, color: colors.textSecondary, letterSpacing: 0.4 },
    small: { fontSize: 11, fontFamily: fonts.bold, color: colors.textTertiary, letterSpacing: 0.3 },
  };
}

export type Typography = ReturnType<typeof getTypography>;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const TOTAL_DAYS = 99;
