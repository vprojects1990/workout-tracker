import { mealTargets, mealLogs } from '@/db/schema';
import type { MealTarget, NewMealTarget, MealLog, NewMealLog } from '@/db/schema';

describe('Meal Tracking Schema', () => {
  describe('mealTargets table', () => {
    it('should have the correct table name', () => {
      expect((mealTargets as any)[Symbol.for('drizzle:Name')]).toBe('meal_targets');
    });

    it('should define all required columns', () => {
      const columns = mealTargets as Record<string, any>;
      expect(columns.id).toBeDefined();
      expect(columns.calories).toBeDefined();
      expect(columns.protein).toBeDefined();
      expect(columns.carbs).toBeDefined();
      expect(columns.fat).toBeDefined();
      expect(columns.updatedAt).toBeDefined();
    });
  });

  describe('mealLogs table', () => {
    it('should have the correct table name', () => {
      expect((mealLogs as any)[Symbol.for('drizzle:Name')]).toBe('meal_logs');
    });

    it('should define all required columns', () => {
      const columns = mealLogs as Record<string, any>;
      expect(columns.id).toBeDefined();
      expect(columns.date).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.calories).toBeDefined();
      expect(columns.protein).toBeDefined();
      expect(columns.carbs).toBeDefined();
      expect(columns.fat).toBeDefined();
      expect(columns.photoFilename).toBeDefined();
      expect(columns.createdAt).toBeDefined();
    });
  });

  describe('type exports', () => {
    it('should export MealTarget types', () => {
      // Type-level check: these should compile without error
      const target: MealTarget = {
        id: 'default',
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 65,
        updatedAt: new Date(),
      };
      expect(target.id).toBe('default');
    });

    it('should export MealLog types', () => {
      const log: MealLog = {
        id: '1',
        date: '2026-02-01',
        name: 'Meal 1',
        calories: 500,
        protein: 40,
        carbs: 50,
        fat: 15,
        photoFilename: null,
        createdAt: new Date(),
      };
      expect(log.date).toBe('2026-02-01');
    });
  });
});
