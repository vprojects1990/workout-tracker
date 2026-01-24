import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { userSettings, UserSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type WeightUnit = 'kg' | 'lbs';
export type Theme = 'light' | 'dark' | 'system';

const DEFAULT_SETTINGS: UserSettings = {
  id: 'default',
  weightUnit: 'kg',
  defaultRestSeconds: 90,
  theme: 'system',
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const result = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.id, 'default'))
        .limit(1);

      if (result.length > 0) {
        setSettings(result[0]);
      } else {
        // Create default settings if not exist
        await db.insert(userSettings).values(DEFAULT_SETTINGS);
        setSettings(DEFAULT_SETTINGS);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateWeightUnit = useCallback(async (unit: WeightUnit) => {
    try {
      await db
        .update(userSettings)
        .set({ weightUnit: unit })
        .where(eq(userSettings.id, 'default'));
      setSettings(prev => ({ ...prev, weightUnit: unit }));
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to update weight unit'));
    }
  }, []);

  const updateDefaultRestSeconds = useCallback(async (seconds: number) => {
    try {
      await db
        .update(userSettings)
        .set({ defaultRestSeconds: seconds })
        .where(eq(userSettings.id, 'default'));
      setSettings(prev => ({ ...prev, defaultRestSeconds: seconds }));
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to update rest time'));
    }
  }, []);

  const updateTheme = useCallback(async (theme: Theme) => {
    try {
      await db
        .update(userSettings)
        .set({ theme })
        .where(eq(userSettings.id, 'default'));
      setSettings(prev => ({ ...prev, theme }));
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to update theme'));
    }
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateWeightUnit,
    updateDefaultRestSeconds,
    updateTheme,
  };
}

// Utility function to convert weight based on unit
export function convertWeight(weightKg: number, unit: WeightUnit): number {
  if (unit === 'lbs') {
    return Math.round(weightKg * 2.20462 * 10) / 10;
  }
  return weightKg;
}

// Utility function to convert weight to kg for storage
export function convertToKg(weight: number, unit: WeightUnit): number {
  if (unit === 'lbs') {
    return Math.round(weight / 2.20462 * 10) / 10;
  }
  return weight;
}
