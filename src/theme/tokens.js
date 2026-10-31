/**
 * DUDO Hand Cricket — Theme System.
 * Matches the Coral Red modern mobile UI reference design.
 * Full support for Light/Dark modes & User-Customizable Accent Color.
 */

export const DEFAULT_ACCENT = '#FF5A5F'; // Coral Red from reference image

export const ACCENT_PRESETS = [
  { id: 'coral', name: 'Coral Red', color: '#FF5A5F' },
  { id: 'crimson', name: 'Crimson', color: '#E11D48' },
  { id: 'electric-blue', name: 'Electric Blue', color: '#0D6EFD' },
  { id: 'emerald', name: 'Emerald', color: '#10B981' },
  { id: 'purple', name: 'Royal Violet', color: '#8B5CF6' },
  { id: 'orange', name: 'Cyber Orange', color: '#F97316' },
  { id: 'pink', name: 'Neon Pink', color: '#EC4899' },
  { id: 'gold', name: 'Amber Gold', color: '#F59E0B' },
  { id: 'slate', name: 'Midnight Slate', color: '#334155' },
];

function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function adjustColor(hex, factor) {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (val) => Math.min(255, Math.max(0, Math.round(val)));
  const nr = clamp(r * factor);
  const ng = clamp(g * factor);
  const nb = clamp(b * factor);
  return `#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1)}`;
}

export function buildPalette(isDark, primary = DEFAULT_ACCENT) {
  const { r, g, b } = hexToRgb(primary);
  const primaryDark = adjustColor(primary, 0.78);
  const primaryLight = adjustColor(primary, 1.25);
  const primaryAlpha = (a) => `rgba(${r}, ${g}, ${b}, ${a})`;

  if (isDark) {
    return {
      // Primary custom accent
      primary,
      primaryDark,
      primaryLight,
      primaryGradient: [primary, primaryDark],
      primaryTint: primaryAlpha(0.15),
      primaryAlpha,

      // Complementary accents
      accent: '#FF4D6D',
      accentCyan: '#06B6D4',
      accentGold: '#F59E0B',
      accentGreen: '#10B981',
      accentOrange: '#F97316',

      // Backgrounds (Clean deep charcoal/black like dark screens in reference)
      background: '#121216',
      backgroundCard: '#1C1C22',
      backgroundCardTint: primaryAlpha(0.14),
      backgroundElevated: '#25252E',
      backgroundGlass: 'rgba(255, 255, 255, 0.05)',
      backgroundGlassHighlight: primaryAlpha(0.18),

      // Text
      textPrimary: '#FFFFFF',
      textSecondary: '#A1A1AA',
      textMuted: '#71717A',
      textAccent: primary,

      // Teams
      teamA: primary,
      teamALight: primaryAlpha(0.2),
      teamB: '#06B6D4',
      teamBLight: 'rgba(6, 182, 212, 0.2)',

      // States
      success: '#10B981',
      danger: primary,
      warning: '#F59E0B',
      info: '#38BDF8',

      // Borders
      border: 'rgba(255, 255, 255, 0.08)',
      borderLight: 'rgba(255, 255, 255, 0.15)',
      borderGlow: primaryAlpha(0.35),

      // Score
      runs: '#10B981',
      out: primary,

      // Input
      inputBg: '#1C1C22',
      inputText: '#FFFFFF',
      inputPlaceholder: '#71717A',
      inputBorder: 'rgba(255, 255, 255, 0.12)',

      // Shadow
      shadow: primaryDark,

      // Status bar
      statusBar: 'light-content',

      // Gradients
      cardGradientStart: '#1C1C22',
      cardGradientEnd: '#25252E',
      gradientBg: ['#121216', '#1A1A22', '#121216'],
      pillBtnBg: primary,
      pillBtnText: '#FFFFFF',
      glow: primaryAlpha(0.3),
    };
  }

  // Light Mode (Crisp white with soft warm blush tints from reference)
  return {
    // Primary custom accent
    primary,
    primaryDark,
    primaryLight,
    primaryGradient: [primary, primaryDark],
    primaryTint: primaryAlpha(0.08),
    primaryAlpha,

    // Complementary accents
    accent: '#FF3366',
    accentCyan: '#00B8D4',
    accentGold: '#D97706',
    accentGreen: '#059669',
    accentOrange: '#EA580C',

    // Backgrounds (Clean porcelain white & soft blush card backgrounds)
    background: '#F9FAFB',
    backgroundCard: '#FFFFFF',
    backgroundCardTint: primaryAlpha(0.07),
    backgroundElevated: '#F3F4F6',
    backgroundGlass: 'rgba(255, 255, 255, 0.9)',
    backgroundGlassHighlight: primaryAlpha(0.1),

    // Text
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    textAccent: primary,

    // Teams
    teamA: primary,
    teamALight: primaryAlpha(0.12),
    teamB: '#0284C7',
    teamBLight: 'rgba(2, 132, 199, 0.12)',

    // States
    success: '#059669',
    danger: primary,
    warning: '#D97706',
    info: '#0284C7',

    // Borders
    border: 'rgba(17, 24, 39, 0.07)',
    borderLight: 'rgba(17, 24, 39, 0.12)',
    borderGlow: primaryAlpha(0.25),

    // Score
    runs: '#059669',
    out: primary,

    // Input
    inputBg: '#FFFFFF',
    inputText: '#111827',
    inputPlaceholder: '#9CA3AF',
    inputBorder: 'rgba(17, 24, 39, 0.12)',

    // Shadow
    shadow: primaryAlpha(0.35),

    // Status bar
    statusBar: 'dark-content',

    // Gradients
    cardGradientStart: '#FFFFFF',
    cardGradientEnd: '#FFF5F5',
    gradientBg: ['#FFFFFF', '#FAF5F5', '#F5F5F7'],
    pillBtnBg: primary,
    pillBtnText: '#FFFFFF',
    glow: primaryAlpha(0.15),
  };
}

export const DarkColors = buildPalette(true, DEFAULT_ACCENT);
export const LightColors = buildPalette(false, DEFAULT_ACCENT);

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
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  '2xl': 28,
  full: 9999,
};

export const Gradients = {
  primary: [DEFAULT_ACCENT, '#D73C41'],
  danger: ['#FF5A5F', '#BE123C'],
  success: ['#10B981', '#047857'],
  gold: ['#F59E0B', '#D97706'],
  dark: ['#121216', '#1C1C22'],
  card: ['#1C1C22', '#25252E'],
  lightCard: ['#FFFFFF', '#FFF5F5'],
  light: ['#FFFFFF', '#F5F5F7'],
};

// Default export for backward compat
export const Colors = DarkColors;
