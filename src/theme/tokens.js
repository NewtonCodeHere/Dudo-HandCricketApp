/**
 * Hand Cricket — Complete theme system.
 * Dark and Light palettes with full token sets.
 */

export const DarkColors = {
  // Core
  primary: '#6C63FF',
  primaryDark: '#4C45CC',
  primaryLight: '#9B95FF',

  // Accents
  accent: '#FF6B6B',
  accentGold: '#FFD700',
  accentGreen: '#4ECDC4',
  accentOrange: '#FF8C42',

  // Background layers
  background: '#0A0A1A',
  backgroundCard: '#12122A',
  backgroundElevated: '#1A1A35',
  backgroundGlass: 'rgba(255,255,255,0.06)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A8A8C8',
  textMuted: '#5A5A7A',
  textAccent: '#6C63FF',

  // Teams
  teamA: '#6C63FF',
  teamALight: 'rgba(108, 99, 255, 0.15)',
  teamB: '#FF6B6B',
  teamBLight: 'rgba(255, 107, 107, 0.15)',

  // States
  success: '#4ECDC4',
  danger: '#FF6B6B',
  warning: '#FFD700',
  info: '#64B5F6',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.15)',

  // Score
  runs: '#4ECDC4',
  out: '#FF6B6B',

  // Input
  inputBg: '#1A1A35',
  inputText: '#FFFFFF',
  inputPlaceholder: '#5A5A7A',
  inputBorder: 'rgba(255,255,255,0.12)',

  // Shadow
  shadow: '#000000',

  // Status bar
  statusBar: 'light-content',

  // Card gradient
  cardGradientStart: '#12122A',
  cardGradientEnd: '#1A1A35',
};

export const LightColors = {
  // Core
  primary: '#6C63FF',
  primaryDark: '#4C45CC',
  primaryLight: '#9B95FF',

  // Accents
  accent: '#FF6B6B',
  accentGold: '#E6A800',
  accentGreen: '#2AAF9F',
  accentOrange: '#FF8C42',

  // Background layers
  background: '#F4F4FF',
  backgroundCard: '#FFFFFF',
  backgroundElevated: '#EEEEFF',
  backgroundGlass: 'rgba(108,99,255,0.05)',

  // Text
  textPrimary: '#12122A',
  textSecondary: '#4A4A6A',
  textMuted: '#9A9ABB',
  textAccent: '#6C63FF',

  // Teams
  teamA: '#6C63FF',
  teamALight: 'rgba(108, 99, 255, 0.1)',
  teamB: '#FF6B6B',
  teamBLight: 'rgba(255, 107, 107, 0.1)',

  // States
  success: '#2AAF9F',
  danger: '#E84040',
  warning: '#E6A800',
  info: '#2196F3',

  // Borders
  border: 'rgba(0,0,0,0.08)',
  borderLight: 'rgba(0,0,0,0.15)',

  // Score
  runs: '#2AAF9F',
  out: '#E84040',

  // Input
  inputBg: '#FFFFFF',
  inputText: '#12122A',
  inputPlaceholder: '#9A9ABB',
  inputBorder: 'rgba(0,0,0,0.12)',

  // Shadow
  shadow: '#6C63FF',

  // Status bar
  statusBar: 'dark-content',

  // Card gradient
  cardGradientStart: '#FFFFFF',
  cardGradientEnd: '#F0F0FF',
};

export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
  '5xl': 48,
  thin: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const Gradients = {
  primary: ['#6C63FF', '#4C45CC'],
  danger: ['#FF6B6B', '#CC3333'],
  success: ['#4ECDC4', '#2EAA9D'],
  gold: ['#FFD700', '#FFA500'],
  dark: ['#0A0A1A', '#12122A'],
  card: ['#12122A', '#1A1A35'],
};

// Default export for backward compat
export const Colors = DarkColors;
