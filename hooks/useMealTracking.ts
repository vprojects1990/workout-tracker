import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/db';
import { mealTargets, mealLogs } from '@/db/schema';
import type { MealTarget, MealLog } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { formatDateKey, getWeekdaysOfWeek, isFutureDate } from '@/utils/mealDates';
import { deleteMealPhoto } from '@/utils/mealImage';
import * as Crypto from 'expo-crypto';

// ── Types ──────────────────────────────────────────────────────────

export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealInput = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoFilename?: string | null;
};

export type AdherenceStatus = 'on-target' | 'close' | 'off-target' | 'over' | 'no-data';

export type WeekDaySummary = {
  date: string;
  dayOfWeek: number;
  totalCalories: number;
  mealCount: number;
  status: AdherenceStatus;
};

// ── Pure functions (exported for testing) ──────────────────────────

export function computeMacroTotals(
  meals: Pick<MealLog, 'calories' | 'protein' | 'carbs' | 'fat'>[]
): MacroTotals {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function getAdherenceStatus(
  totalCalories: number,
  mealCount: number,
  targetCalories: number
): AdherenceStatus {
  if (mealCount === 0 || targetCalories === 0) return 'no-data';
  const ratio = totalCalories / targetCalories;
  if (ratio > 1.1) return 'over';
  if (ratio >= 0.9) return 'on-target';
  if (ratio >= 0.75) return 'close';
  return 'off-target';
}

// ── Hook ───────────────────────────────────────────────────────────

export function useMealTracking(selectedDate: string, weekOffset: number = 0) {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [targets, setTargets] = useState<MealTarget | null>(null);
  const [weekSummary, setWeekSummary] = useState<WeekDaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ── Fetch targets ──

  const fetchTargets = useCallback(async () => {
    try {
      const result = await db
        .select()
        .from(mealTargets)
        .where(eq(mealTargets.id, 'default'));
      setTargets(result[0] ?? null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch targets'));
    }
  }, []);

  // ── Fetch meals for selected date ──

  const fetchMeals = useCallback(async () => {
    try {
      setLoading(true);
      const result = await db
        .select()
        .from(mealLogs)
        .where(eq(mealLogs.date, selectedDate))
        .orderBy(mealLogs.createdAt);
      setMeals(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch meals'));
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // ── Fetch weekly summary ──

  const fetchWeekSummary = useCallback(async () => {
    try {
      const weekdays = getWeekdaysOfWeek(weekOffset);
      const mondayKey = formatDateKey(weekdays[0]);
      const fridayKey = formatDateKey(weekdays[4]);

      const result = await db
        .select({
          date: mealLogs.date,
          totalCalories: sql<number>`SUM(${mealLogs.calories})`,
          mealCount: sql<number>`COUNT(*)`,
        })
        .from(mealLogs)
        .where(and(gte(mealLogs.date, mondayKey), lte(mealLogs.date, fridayKey)))
        .groupBy(mealLogs.date);

      const resultMap = new Map(result.map(r => [r.date, r]));
      const targetCals = targets?.calories ?? 2000;

      const summary: WeekDaySummary[] = weekdays.map(day => {
        const dateKey = formatDateKey(day);
        const data = resultMap.get(dateKey);
        const totalCalories = data?.totalCalories ?? 0;
        const mealCount = data?.mealCount ?? 0;

        let status: AdherenceStatus;
        if (isFutureDate(day)) {
          status = 'no-data';
        } else {
          status = getAdherenceStatus(totalCalories, mealCount, targetCals);
        }

        return {
          date: dateKey,
          dayOfWeek: day.getDay(),
          totalCalories,
          mealCount,
          status,
        };
      });

      setWeekSummary(summary);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch week summary'));
    }
  }, [weekOffset, targets?.calories]);

  // ── Effects ──

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  useEffect(() => {
    fetchWeekSummary();
  }, [fetchWeekSummary]);

  // ── Mutations ──

  const addMeal = useCallback(async (input: MealInput) => {
    try {
      const id = `meal-${Crypto.randomUUID()}`;
      await db.insert(mealLogs).values({
        id,
        date: selectedDate,
        name: input.name,
        calories: input.calories,
        protein: input.protein,
        carbs: input.carbs,
        fat: input.fat,
        photoFilename: input.photoFilename ?? null,
        createdAt: new Date(),
      });
      await fetchMeals();
      await fetchWeekSummary();
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to add meal'));
    }
  }, [selectedDate, fetchMeals, fetchWeekSummary]);

  const updateMeal = useCallback(async (id: string, input: Partial<MealInput>) => {
    try {
      // Clean up old photo if photo is being changed
      if ('photoFilename' in input) {
        const [existing] = await db
          .select({ photoFilename: mealLogs.photoFilename })
          .from(mealLogs)
          .where(eq(mealLogs.id, id));
        if (existing?.photoFilename && existing.photoFilename !== input.photoFilename) {
          await deleteMealPhoto(existing.photoFilename);
        }
      }
      await db.update(mealLogs).set(input).where(eq(mealLogs.id, id));
      await fetchMeals();
      await fetchWeekSummary();
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to update meal'));
    }
  }, [fetchMeals, fetchWeekSummary]);

  const deleteMeal = useCallback(async (id: string) => {
    try {
      // Query DB directly to avoid stale closure over meals state
      const [meal] = await db
        .select({ photoFilename: mealLogs.photoFilename })
        .from(mealLogs)
        .where(eq(mealLogs.id, id));
      if (meal?.photoFilename) {
        await deleteMealPhoto(meal.photoFilename);
      }
      await db.delete(mealLogs).where(eq(mealLogs.id, id));
      await fetchMeals();
      await fetchWeekSummary();
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to delete meal'));
    }
  }, [fetchMeals, fetchWeekSummary]);

  const updateTargets = useCallback(async (
    newTargets: { calories: number; protein: number; carbs: number; fat: number }
  ) => {
    try {
      await db.insert(mealTargets).values({
        id: 'default',
        ...newTargets,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: mealTargets.id,
        set: { ...newTargets, updatedAt: new Date() },
      });
      await fetchTargets();
      await fetchWeekSummary();
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to update targets'));
    }
  }, [fetchTargets, fetchWeekSummary]);

  // ── Computed ──

  const totals = useMemo(() => computeMacroTotals(meals), [meals]);

  return {
    meals,
    targets,
    totals,
    weekSummary,
    loading,
    error,
    addMeal,
    updateMeal,
    deleteMeal,
    updateTargets,
    refetch: fetchMeals,
  };
}
