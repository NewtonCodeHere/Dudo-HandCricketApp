import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DarkColors, LightColors } from './tokens';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  // null = follow system, 'dark' = force dark, 'light' = force light
  const [override, setOverride] = useState(null);

  const isDark = override !== null ? override === 'dark' : systemScheme !== 'light';

  const colors = useMemo(() => (isDark ? DarkColors : LightColors), [isDark]);

  const toggleTheme = useCallback(() => {
    setOverride((prev) => {
      if (prev === null) return isDark ? 'light' : 'dark';
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, [isDark]);

  const setTheme = useCallback((mode) => {
    setOverride(mode); // 'dark' | 'light' | null (system)
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Hook — returns current color palette */
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
