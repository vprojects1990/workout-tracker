import { db } from './index';
import { exercises, workoutTemplates, templateExercises, userSettings, workoutSplits } from './schema';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  // Create tables if they don't exist
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS workout_splits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      primary_muscle TEXT NOT NULL,
      secondary_muscles TEXT,
      equipment TEXT NOT NULL,
      is_custom INTEGER NOT NULL DEFAULT 0
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS workout_templates (
      id TEXT PRIMARY KEY,
      split_id TEXT REFERENCES workout_splits(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS template_exercises (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL REFERENCES workout_templates(id),
      exercise_id TEXT NOT NULL REFERENCES exercises(id),
      order_index INTEGER NOT NULL,
      target_rep_min INTEGER NOT NULL,
      target_rep_max INTEGER NOT NULL,
      target_sets INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      template_id TEXT REFERENCES workout_templates(id),
      template_name TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      duration_seconds INTEGER
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS set_logs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES workout_sessions(id),
      exercise_id TEXT NOT NULL REFERENCES exercises(id),
      set_number INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL NOT NULL,
      rest_seconds INTEGER
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      weight_unit TEXT NOT NULL DEFAULT 'kg',
      default_rest_seconds INTEGER NOT NULL DEFAULT 90,
      theme TEXT NOT NULL DEFAULT 'system'
    )
  `);

  // Initialize default settings if not exists
  await db.run(sql`
    INSERT OR IGNORE INTO user_settings (id, weight_unit, default_rest_seconds, theme)
    VALUES ('default', 'kg', 90, 'system')
  `);

  // Meal tracking tables
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS meal_targets (
      id TEXT PRIMARY KEY DEFAULT 'default',
      calories INTEGER NOT NULL DEFAULT 2000,
      protein INTEGER NOT NULL DEFAULT 150,
      carbs INTEGER NOT NULL DEFAULT 250,
      fat INTEGER NOT NULL DEFAULT 65,
      updated_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS meal_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      photo_filename TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE INDEX IF NOT EXISTS idx_meal_logs_date ON meal_logs(date)
  `);

  // Initialize default meal targets
  await db.run(sql`
    INSERT OR IGNORE INTO meal_targets (id, calories, protein, carbs, fat, updated_at)
    VALUES ('default', 2000, 150, 250, 65, ${Math.floor(Date.now() / 1000)})
  `);

  // Migration: Add split_id column to workout_templates if it doesn't exist
  // This handles databases created before splits were introduced
  try {
    await db.run(sql`ALTER TABLE workout_templates ADD COLUMN split_id TEXT REFERENCES workout_splits(id)`);
  } catch (e) {
    // Column already exists, ignore the error
  }

  // Migration: Add order_index column to workout_templates if it doesn't exist
  try {
    await db.run(sql`ALTER TABLE workout_templates ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore the error
  }

  // Migration: Add day_of_week column to workout_templates if it doesn't exist
  try {
    await db.run(sql`ALTER TABLE workout_templates ADD COLUMN day_of_week INTEGER`);
  } catch (e) {
    // Column already exists, ignore the error
  }
}
