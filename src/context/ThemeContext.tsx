import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { generateClient } from 'aws-amplify/api';
import { themes, DEFAULT_THEME, getThemeById } from '../themes';
import type { ThemeId, ThemeDefinition } from '../themes';
import * as customQueries from '../graphql/customQueries';

const STORAGE_KEY = 'rickshareah-theme';

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  themes: ThemeDefinition[];
  currentTheme: ThemeDefinition;
  isLoading: boolean;
  isSyncing: boolean;
}

interface UserPreferencesRecord {
  id: string;
  theme: string | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Lazy GraphQL client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null;
const getClient = () => {
  if (!_client) {
    _client = generateClient({ authMode: 'userPool' });
  }
  return _client;
};

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
  // Check localStorage first for instant load (no flash)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && getThemeById(stored as ThemeId)) {
      return stored as ThemeId;
    }
  }
  return DEFAULT_THEME;
}

interface ThemeProviderProps {
  children: ReactNode;
  userId?: string | null;
}

export function ThemeProvider({ children, userId }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const preferencesIdRef = useRef<string | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Apply initial theme immediately to avoid flash
  useEffect(() => {
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
  }, []);

  // Load preferences from backend when userId changes (login/logout)
  useEffect(() => {
    // Normalize undefined to null for consistent comparison
    const normalizedUserId = userId ?? null;
    
    // Skip if userId hasn't changed
    if (lastUserIdRef.current === normalizedUserId) return;
    lastUserIdRef.current = normalizedUserId;

    if (!userId) {
      // User logged out - clear preferences ID but keep theme
      preferencesIdRef.current = null;
      return;
    }

    // User logged in - fetch their preferences
    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        console.log('[ThemeContext] Loading preferences for user:', userId);
        
        const result = await getClient().graphql({
          query: customQueries.getUserPreferencesByUserId,
          variables: { userId }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = (result as any).data?.userPreferencesByUserId?.items || [];
        
        if (items.length > 0) {
          const prefs: UserPreferencesRecord = items[0];
          preferencesIdRef.current = prefs.id;
          
          if (prefs.theme && getThemeById(prefs.theme as ThemeId)) {
            console.log('[ThemeContext] Loaded theme from backend:', prefs.theme);
            setThemeState(prefs.theme as ThemeId);
            localStorage.setItem(STORAGE_KEY, prefs.theme);
          }
        } else {
          console.log('[ThemeContext] No preferences found, will create on first change');
          preferencesIdRef.current = null;
        }
      } catch (error) {
        console.error('[ThemeContext] Failed to load preferences:', error);
        // Fall back to localStorage (already applied)
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  // Save preferences to backend
  const savePreferences = useCallback(async (newTheme: ThemeId) => {
    if (!userId) {
      console.log('[ThemeContext] No user logged in, skipping backend sync');
      return;
    }

    setIsSyncing(true);
    try {
      if (preferencesIdRef.current) {
        // Update existing preferences
        console.log('[ThemeContext] Updating preferences:', preferencesIdRef.current);
        await getClient().graphql({
          query: customQueries.updateUserPreferences,
          variables: {
            input: {
              id: preferencesIdRef.current,
              theme: newTheme,
            }
          }
        });
      } else {
        // Create new preferences
        console.log('[ThemeContext] Creating new preferences for user:', userId);
        const result = await getClient().graphql({
          query: customQueries.createUserPreferences,
          variables: {
            input: {
              userId,
              theme: newTheme,
            }
          }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newPrefs = (result as any).data?.createUserPreferences;
        if (newPrefs) {
          preferencesIdRef.current = newPrefs.id;
        }
      }
      console.log('[ThemeContext] Preferences synced to backend');
    } catch (error) {
      console.error('[ThemeContext] Failed to save preferences:', error);
      // Theme is still applied locally, will try again on next change
    } finally {
      setIsSyncing(false);
    }
  }, [userId]);

  const setTheme = useCallback((newTheme: ThemeId) => {
    // Validate theme exists
    if (!getThemeById(newTheme)) {
      console.warn(`[ThemeContext] Invalid theme: ${newTheme}`);
      return;
    }
    
    // Save to localStorage immediately (for instant feedback)
    localStorage.setItem(STORAGE_KEY, newTheme);
    
    // Update state
    setThemeState(newTheme);
    
    // Sync to backend (async, non-blocking)
    savePreferences(newTheme);
    
    console.log(`[ThemeContext] Theme changed to: ${newTheme}`);
  }, [savePreferences]);

  const currentTheme = getThemeById(theme) || themes[0];

  const value: ThemeContextType = {
    theme,
    setTheme,
    themes,
    currentTheme,
    isLoading,
    isSyncing,
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
