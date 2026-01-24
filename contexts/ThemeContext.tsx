import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  setTheme: (theme: Theme) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from database on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const result = await db
          .select()
          .from(userSettings)
          .where(eq(userSettings.id, 'default'))
          .limit(1);

        if (result.length > 0 && result[0].theme) {
          setThemeState(result[0].theme as Theme);
        }
      } catch (e) {
        console.error('Failed to load theme:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const setTheme = useCallback(async (newTheme: Theme) => {
    try {
      await db
        .update(userSettings)
        .set({ theme: newTheme })
        .where(eq(userSettings.id, 'default'));
      setThemeState(newTheme);
    } catch (e) {
      console.error('Failed to update theme:', e);
    }
  }, []);

  // Determine the actual color scheme to use
  const colorScheme: ColorScheme = theme === 'system'
    ? (systemColorScheme ?? 'light')
    : theme;

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// This replaces the native useColorScheme to respect user preference
export function useColorScheme(): ColorScheme {
  const context = useContext(ThemeContext);
  const systemColorScheme = useSystemColorScheme();

  // If not within ThemeProvider, fall back to system
  if (context === undefined) {
    return systemColorScheme ?? 'light';
  }

  return context.colorScheme;
}
