import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { themes, DEFAULT_THEME, getThemeById } from '../themes';
import type { ThemeId, ThemeDefinition } from '../themes';

const STORAGE_KEY = 'rickshareah-theme';

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeDefinition[];
  currentTheme: ThemeDefinition;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTheme(themeId: ThemeId) {
  const theme = getThemeById(themeId);
  if (!theme) return;

  // Set data-theme attribute on document element
  document.documentElement.setAttribute('data-theme', themeId);
  
  // Also update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme.variables.colorCream);
  }
}

function getInitialTheme(): ThemeId {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && getThemeById(stored as ThemeId)) {
      return stored as ThemeId;
    }
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Apply initial theme immediately to avoid flash
  useEffect(() => {
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
  }, []);

  const setTheme = useCallback((newTheme: ThemeId) => {
    // Validate theme exists
    if (!getThemeById(newTheme)) {
      console.warn(`[ThemeContext] Invalid theme: ${newTheme}`);
      return;
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, newTheme);
    
    // Update state
    setThemeState(newTheme);
    
    console.log(`[ThemeContext] Theme changed to: ${newTheme}`);
  }, []);

  const currentTheme = getThemeById(theme) || themes[0];

  const value: ThemeContextType = {
    theme,
    setTheme,
    themes,
    currentTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
