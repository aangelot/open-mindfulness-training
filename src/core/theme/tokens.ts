/**
 * Design tokens from the openmindfulness.net visual identity
 * (WordPress "Total" theme): blue accents, Open Sans, white and light grey surfaces.
 */
import { Platform } from 'react-native';

const brand = {
  blue: '#4092df', // buttons, accents
  blueDark: '#1e73be', // links
  sky: '#27a9e1', // section headings, "Exposé n" / "Pratique n"
  skyPale: '#edfbff', // audio side panel
} as const;

export const colors = {
  light: {
    ...brand,
    primary: brand.blue,
    link: brand.blueDark,
    heading: brand.sky,
    text: '#424242',
    textMuted: '#777777',
    background: '#ffffff',
    surface: '#f5f5f5',
    surfaceAccent: brand.skyPale,
    border: '#ededed',
    onPrimary: '#ffffff',
  },
  dark: {
    ...brand,
    primary: '#5aa5ea',
    link: '#7db8f0',
    heading: '#4fc0ef',
    text: '#e6e6e6',
    textMuted: '#a0a0a0',
    background: '#121417',
    surface: '#1d2024',
    surfaceAccent: '#14273a',
    border: '#2a2e33',
    onPrimary: '#ffffff',
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ThemeColors = { [K in keyof (typeof colors)['light']]: string };

/**
 * Open Sans is embedded at build time by the expo-font plugin (app.json).
 * Android: one family + fontWeight. iOS: one PostScript name per face.
 */
export const fontFamily = (weight: 300 | 400 | 600 | 700 = 400, italic = false): string =>
  Platform.select({
    android: 'OpenSans',
    ios: `OpenSans-${{ 300: 'Light', 400: italic ? 'Italic' : 'Regular', 600: 'SemiBold', 700: 'Bold' }[weight]}`,
    default: 'Open Sans',
  });

export const typography = {
  title: { fontSize: 26, lineHeight: 34, fontWeight: '600' },
  subtitle: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 26, fontWeight: '400' },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.4 },
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 4, md: 8, lg: 16, pill: 999 } as const;
