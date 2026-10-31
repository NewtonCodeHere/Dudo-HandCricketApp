import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useColorScheme, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { buildPalette, DEFAULT_ACCENT, ACCENT_PRESETS, BorderRadius } from './tokens';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  // null = follow system, 'dark' = force dark, 'light' = force light
  const [override, setOverride] = useState(null);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);

  const isDark = override !== null ? override === 'dark' : systemScheme !== 'light';

  const colors = useMemo(() => buildPalette(isDark, accentColor), [isDark, accentColor]);

  const toggleTheme = useCallback(() => {
    setOverride((prev) => {
      if (prev === null) return isDark ? 'light' : 'dark';
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, [isDark]);

  const setTheme = useCallback((mode) => {
    setOverride(mode); // 'dark' | 'light' | null (system)
  }, []);

  const changeAccentColor = useCallback((newColor) => {
    setAccentColor(newColor);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors,
        toggleTheme,
        setTheme,
        accentColor,
        setAccentColor: changeAccentColor,
        presets: ACCENT_PRESETS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/** Hook — returns current dynamic color palette */
export function useColors() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useColors must be used inside ThemeProvider');
  return ctx.colors;
}

/** Hook — returns full theme context */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

/** Floating / header quick theme toggle button */
export function ThemeToggle({ style }) {
  const { isDark, toggleTheme } = useTheme();
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.8}
      style={[
        toggleStyles.button,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.primaryTint,
          borderColor: colors.borderLight,
        },
        style,
      ]}
    >
      <Text style={toggleStyles.icon}>{isDark ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
  );
}

const toggleStyles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
});
