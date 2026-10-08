import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  headerBg: string;
  navBg: string;
  primary: string;
  primaryLight: string;
  inputBg: string;
  inputBorder: string;
  statusLiveBg: string;
  statusLiveText: string;
  statusOfflineBg: string;
  statusOfflineText: string;
  divider: string;
  subtleBoxBg: string;
}

export const lightTheme: ThemeColors = {
  bg: '#f8fafc',
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  headerBg: '#ffffff',
  navBg: '#ffffff',
  primary: '#2563eb',
  primaryLight: '#eff6ff',
  inputBg: '#f8fafc',
  inputBorder: '#cbd5e1',
  statusLiveBg: '#ecfdf5',
  statusLiveText: '#047857',
  statusOfflineBg: '#fef2f2',
  statusOfflineText: '#b91c1c',
  divider: '#f1f5f9',
  subtleBoxBg: '#f8fafc',
};

export const darkTheme: ThemeColors = {
  bg: '#0b0f17',
  cardBg: '#161f2c',
  cardBorder: '#283548',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  border: '#1e293b',
  headerBg: '#161f2c',
  navBg: '#161f2c',
  primary: '#3b82f6',
  primaryLight: '#1e293b',
  inputBg: '#1e293b',
  inputBorder: '#334155',
  statusLiveBg: '#064e3b',
  statusLiveText: '#34d399',
  statusOfflineBg: '#7f1d1d',
  statusOfflineText: '#fca5a5',
  divider: '#1e293b',
  subtleBoxBg: '#161f2c',
};

interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  colorScheme: ColorSchemeName;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  colorScheme: 'light',
  themeMode: 'system',
  setThemeMode: () => {},
});

const THEME_STORAGE_KEY = '@app_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'system' || saved === 'light' || saved === 'dark') {
        setThemeModeState(saved as ThemeMode);
      }
    }).catch(() => {});
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  };

  const isDark = themeMode === 'system' ? colorScheme === 'dark' : themeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colorScheme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

