# Gym Track MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a gym tracking app with progressive overload methodology (double progression) for iOS and Android.

**Architecture:** Expo/React Native with file-based routing (expo-router), SQLite for local storage via expo-sqlite with Drizzle ORM, React Context for state management. Three-tab navigation: Workout, History, Insights.

**Tech Stack:** Expo 54, React Native 0.81, expo-sqlite, Drizzle ORM, TypeScript, expo-router

---

## Phase 1: Foundation

### Task 1: Install Database Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install expo-sqlite and drizzle-orm**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npx expo install expo-sqlite && npm install drizzle-orm && npm install -D drizzle-kit
```

**Step 2: Verify installation**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npm ls expo-sqlite drizzle-orm
```

Expected: Both packages listed without errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add expo-sqlite and drizzle-orm dependencies"
```

---

### Task 2: Create Database Schema

**Files:**
- Create: `db/schema.ts`
- Create: `db/index.ts`

**Step 1: Create database schema file**

Create `db/schema.ts`:
```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Exercises table - the library of available exercises
export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  primaryMuscle: text('primary_muscle').notNull(),
  secondaryMuscles: text('secondary_muscles'), // JSON array stored as string
  equipment: text('equipment').notNull(), // barbell | dumbbell | cable | machine | bodyweight
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
});

// Workout templates - saved workout routines
export const workoutTemplates = sqliteTable('workout_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // upper | lower | custom
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Template exercises - exercises within a template with order and rep ranges
export const templateExercises = sqliteTable('template_exercises', {
  id: text('id').primaryKey(),
  templateId: text('template_id').notNull().references(() => workoutTemplates.id),
  exerciseId: text('exercise_id').notNull().references(() => exercises.id),
  orderIndex: integer('order_index').notNull(),
  targetRepMin: integer('target_rep_min').notNull(),
  targetRepMax: integer('target_rep_max').notNull(),
  targetSets: integer('target_sets').notNull(),
});

// Workout sessions - completed workouts
export const workoutSessions = sqliteTable('workout_sessions', {
  id: text('id').primaryKey(),
  templateId: text('template_id').references(() => workoutTemplates.id),
  templateName: text('template_name').notNull(), // Denormalized for history display
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  durationSeconds: integer('duration_seconds'),
});

// Set logs - individual sets within a session
export const setLogs = sqliteTable('set_logs', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => workoutSessions.id),
  exerciseId: text('exercise_id').notNull().references(() => exercises.id),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps').notNull(),
  weight: real('weight').notNull(),
  restSeconds: integer('rest_seconds'),
});

// User settings
export const userSettings = sqliteTable('user_settings', {
  id: text('id').primaryKey().default('default'),
  weightUnit: text('weight_unit').notNull().default('kg'), // kg | lbs
  defaultRestSeconds: integer('default_rest_seconds').notNull().default(90),
  theme: text('theme').notNull().default('system'), // light | dark | system
});

// Type exports
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type NewWorkoutTemplate = typeof workoutTemplates.$inferInsert;
export type TemplateExercise = typeof templateExercises.$inferSelect;
export type NewTemplateExercise = typeof templateExercises.$inferInsert;
export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;
export type SetLog = typeof setLogs.$inferSelect;
export type NewSetLog = typeof setLogs.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
```

**Step 2: Create database initialization file**

Create `db/index.ts`:
```typescript
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expo = openDatabaseSync('gymtrack.db');
export const db = drizzle(expo, { schema });

export * from './schema';
```

**Step 3: Verify TypeScript compiles**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npx tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add db/
git commit -m "feat: add database schema with drizzle-orm"
```

---

### Task 3: Create Database Migration and Seed Data

**Files:**
- Create: `db/migrations.ts`
- Create: `db/seed.ts`

**Step 1: Create migrations file**

Create `db/migrations.ts`:
```typescript
import { db } from './index';
import { exercises, workoutTemplates, templateExercises, userSettings } from './schema';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  // Create tables if they don't exist
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
      name TEXT NOT NULL,
      type TEXT NOT NULL,
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
}
```

**Step 2: Create seed data file**

Create `db/seed.ts`:
```typescript
import { db } from './index';
import { exercises, workoutTemplates, templateExercises } from './schema';
import { eq } from 'drizzle-orm';

const EXERCISE_DATA = [
  // Chest
  { id: 'bench-press-barbell', name: 'Bench Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'barbell', isCustom: false },
  { id: 'incline-bench-press-barbell', name: 'Incline Bench Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'barbell', isCustom: false },
  { id: 'bench-press-dumbbell', name: 'Dumbbell Bench Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'dumbbell', isCustom: false },
  { id: 'incline-bench-press-dumbbell', name: 'Incline Dumbbell Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'dumbbell', isCustom: false },
  { id: 'chest-fly-dumbbell', name: 'Dumbbell Fly', primaryMuscle: 'chest', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'cable-crossover', name: 'Cable Crossover', primaryMuscle: 'chest', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'chest-press-machine', name: 'Chest Press Machine', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'machine', isCustom: false },
  { id: 'push-up', name: 'Push Up', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'bodyweight', isCustom: false },

  // Back
  { id: 'barbell-row', name: 'Barbell Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'barbell', isCustom: false },
  { id: 'dumbbell-row', name: 'Dumbbell Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'lat-pulldown', name: 'Lat Pulldown', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'cable', isCustom: false },
  { id: 'seated-cable-row', name: 'Seated Cable Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'cable', isCustom: false },
  { id: 'pull-up', name: 'Pull Up', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'bodyweight', isCustom: false },
  { id: 'chin-up', name: 'Chin Up', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'bodyweight', isCustom: false },
  { id: 'deadlift', name: 'Deadlift', primaryMuscle: 'back', secondaryMuscles: '["hamstrings","glutes"]', equipment: 'barbell', isCustom: false },
  { id: 't-bar-row', name: 'T-Bar Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'barbell', isCustom: false },

  // Shoulders
  { id: 'overhead-press-barbell', name: 'Overhead Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'barbell', isCustom: false },
  { id: 'overhead-press-dumbbell', name: 'Dumbbell Shoulder Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'lateral-raise', name: 'Lateral Raise', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'front-raise', name: 'Front Raise', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'face-pull', name: 'Face Pull', primaryMuscle: 'shoulders', secondaryMuscles: '["back"]', equipment: 'cable', isCustom: false },
  { id: 'arnold-press', name: 'Arnold Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'dumbbell', isCustom: false },

  // Biceps
  { id: 'barbell-curl', name: 'Barbell Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'hammer-curl', name: 'Hammer Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'preacher-curl', name: 'Preacher Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'cable-curl', name: 'Cable Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },

  // Triceps
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'skull-crusher', name: 'Skull Crusher', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'overhead-tricep-extension', name: 'Overhead Tricep Extension', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'close-grip-bench-press', name: 'Close Grip Bench Press', primaryMuscle: 'triceps', secondaryMuscles: '["chest"]', equipment: 'barbell', isCustom: false },
  { id: 'tricep-dip', name: 'Tricep Dip', primaryMuscle: 'triceps', secondaryMuscles: '["chest","shoulders"]', equipment: 'bodyweight', isCustom: false },
  { id: 'tricep-kickback', name: 'Tricep Kickback', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },

  // Quads
  { id: 'squat-barbell', name: 'Barbell Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'barbell', isCustom: false },
  { id: 'front-squat', name: 'Front Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'barbell', isCustom: false },
  { id: 'leg-press', name: 'Leg Press', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'machine', isCustom: false },
  { id: 'leg-extension', name: 'Leg Extension', primaryMuscle: 'quads', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
  { id: 'goblet-squat', name: 'Goblet Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'dumbbell', isCustom: false },
  { id: 'lunge-dumbbell', name: 'Dumbbell Lunge', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'dumbbell', isCustom: false },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'dumbbell', isCustom: false },
  { id: 'hack-squat', name: 'Hack Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'machine', isCustom: false },

  // Hamstrings
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: '["glutes","back"]', equipment: 'barbell', isCustom: false },
  { id: 'leg-curl-lying', name: 'Lying Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
  { id: 'leg-curl-seated', name: 'Seated Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
  { id: 'good-morning', name: 'Good Morning', primaryMuscle: 'hamstrings', secondaryMuscles: '["back","glutes"]', equipment: 'barbell', isCustom: false },
  { id: 'stiff-leg-deadlift', name: 'Stiff Leg Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: '["glutes","back"]', equipment: 'barbell', isCustom: false },

  // Glutes
  { id: 'hip-thrust', name: 'Hip Thrust', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings"]', equipment: 'barbell', isCustom: false },
  { id: 'glute-bridge', name: 'Glute Bridge', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings"]', equipment: 'bodyweight', isCustom: false },
  { id: 'cable-kickback', name: 'Cable Kickback', primaryMuscle: 'glutes', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings","back"]', equipment: 'barbell', isCustom: false },

  // Core
  { id: 'plank', name: 'Plank', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },
  { id: 'crunch', name: 'Crunch', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },
  { id: 'leg-raise', name: 'Leg Raise', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },
  { id: 'cable-crunch', name: 'Cable Crunch', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'russian-twist', name: 'Russian Twist', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },

  // Calves
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
];

export async function seedExercises() {
  // Check if exercises already exist
  const existingExercises = await db.select().from(exercises).limit(1);
  if (existingExercises.length > 0) {
    return; // Already seeded
  }

  // Insert all exercises
  for (const exercise of EXERCISE_DATA) {
    await db.insert(exercises).values(exercise);
  }
}

export async function seedDefaultTemplates() {
  // Check if templates already exist
  const existingTemplates = await db.select().from(workoutTemplates).limit(1);
  if (existingTemplates.length > 0) {
    return; // Already seeded
  }

  const now = new Date();

  // Upper A template
  await db.insert(workoutTemplates).values({
    id: 'upper-a',
    name: 'Upper A',
    type: 'upper',
    createdAt: now,
  });

  const upperAExercises = [
    { exerciseId: 'bench-press-barbell', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'barbell-row', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'overhead-press-dumbbell', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'lat-pulldown', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'dumbbell-curl', repMin: 10, repMax: 15, sets: 2 },
    { exerciseId: 'tricep-pushdown', repMin: 10, repMax: 15, sets: 2 },
  ];

  for (let i = 0; i < upperAExercises.length; i++) {
    const ex = upperAExercises[i];
    await db.insert(templateExercises).values({
      id: `upper-a-ex-${i}`,
      templateId: 'upper-a',
      exerciseId: ex.exerciseId,
      orderIndex: i,
      targetRepMin: ex.repMin,
      targetRepMax: ex.repMax,
      targetSets: ex.sets,
    });
  }

  // Upper B template
  await db.insert(workoutTemplates).values({
    id: 'upper-b',
    name: 'Upper B',
    type: 'upper',
    createdAt: now,
  });

  const upperBExercises = [
    { exerciseId: 'incline-bench-press-dumbbell', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'seated-cable-row', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'overhead-press-barbell', repMin: 6, repMax: 10, sets: 3 },
    { exerciseId: 'dumbbell-row', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'hammer-curl', repMin: 10, repMax: 15, sets: 2 },
    { exerciseId: 'skull-crusher', repMin: 10, repMax: 15, sets: 2 },
  ];

  for (let i = 0; i < upperBExercises.length; i++) {
    const ex = upperBExercises[i];
    await db.insert(templateExercises).values({
      id: `upper-b-ex-${i}`,
      templateId: 'upper-b',
      exerciseId: ex.exerciseId,
      orderIndex: i,
      targetRepMin: ex.repMin,
      targetRepMax: ex.repMax,
      targetSets: ex.sets,
    });
  }

  // Lower A template
  await db.insert(workoutTemplates).values({
    id: 'lower-a',
    name: 'Lower A',
    type: 'lower',
    createdAt: now,
  });

  const lowerAExercises = [
    { exerciseId: 'squat-barbell', repMin: 6, repMax: 10, sets: 4 },
    { exerciseId: 'romanian-deadlift', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'leg-press', repMin: 10, repMax: 15, sets: 3 },
    { exerciseId: 'leg-curl-lying', repMin: 10, repMax: 15, sets: 3 },
    { exerciseId: 'standing-calf-raise', repMin: 12, repMax: 20, sets: 3 },
  ];

  for (let i = 0; i < lowerAExercises.length; i++) {
    const ex = lowerAExercises[i];
    await db.insert(templateExercises).values({
      id: `lower-a-ex-${i}`,
      templateId: 'lower-a',
      exerciseId: ex.exerciseId,
      orderIndex: i,
      targetRepMin: ex.repMin,
      targetRepMax: ex.repMax,
      targetSets: ex.sets,
    });
  }

  // Lower B template
  await db.insert(workoutTemplates).values({
    id: 'lower-b',
    name: 'Lower B',
    type: 'lower',
    createdAt: now,
  });

  const lowerBExercises = [
    { exerciseId: 'deadlift', repMin: 5, repMax: 8, sets: 4 },
    { exerciseId: 'bulgarian-split-squat', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'leg-extension', repMin: 10, repMax: 15, sets: 3 },
    { exerciseId: 'leg-curl-seated', repMin: 10, repMax: 15, sets: 3 },
    { exerciseId: 'seated-calf-raise', repMin: 12, repMax: 20, sets: 3 },
  ];

  for (let i = 0; i < lowerBExercises.length; i++) {
    const ex = lowerBExercises[i];
    await db.insert(templateExercises).values({
      id: `lower-b-ex-${i}`,
      templateId: 'lower-b',
      exerciseId: ex.exerciseId,
      orderIndex: i,
      targetRepMin: ex.repMin,
      targetRepMax: ex.repMax,
      targetSets: ex.sets,
    });
  }
}

export async function seedDatabase() {
  await seedExercises();
  await seedDefaultTemplates();
}
```

**Step 3: Verify TypeScript compiles**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npx tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add db/
git commit -m "feat: add database migrations and seed data for exercises"
```

---

### Task 4: Create Database Provider Context

**Files:**
- Create: `contexts/DatabaseContext.tsx`

**Step 1: Create database context**

Create `contexts/DatabaseContext.tsx`:
```typescript
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db } from '@/db';
import { runMigrations } from '@/db/migrations';
import { seedDatabase } from '@/db/seed';

type DatabaseContextType = {
  isReady: boolean;
  error: Error | null;
};

const DatabaseContext = createContext<DatabaseContextType>({
  isReady: false,
  error: null,
});

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initDatabase() {
      try {
        await runMigrations();
        await seedDatabase();
        setIsReady(true);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Database initialization failed'));
      }
    }

    initDatabase();
  }, []);

  return (
    <DatabaseContext.Provider value={{ isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add contexts/
git commit -m "feat: add database context provider"
```

---

### Task 5: Integrate Database Provider into App

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: Update root layout to include DatabaseProvider**

Modify `app/_layout.tsx` to wrap the app with DatabaseProvider:
```typescript
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { DatabaseProvider, useDatabase } from '@/contexts/DatabaseContext';
import { View, Text } from '@/components/Themed';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <DatabaseProvider>
      <RootLayoutNav />
    </DatabaseProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isReady, error } = useDatabase();

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Database error: {error.message}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
```

**Step 2: Test that app starts**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npx expo start
```

Expected: App starts without errors, shows loading then tab navigation

**Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: integrate database provider into app root"
```

---

## Phase 2: Navigation & Tab Structure

### Task 6: Update Tab Navigation

**Files:**
- Rename: `app/(tabs)/index.tsx` → `app/(tabs)/workout.tsx`
- Rename: `app/(tabs)/two.tsx` → `app/(tabs)/history.tsx`
- Create: `app/(tabs)/insights.tsx`
- Modify: `app/(tabs)/_layout.tsx`

**Step 1: Create workout tab screen**

Replace contents of `app/(tabs)/index.tsx` with new file `app/(tabs)/workout.tsx`:
```typescript
import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function WorkoutScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <Text style={styles.subtitle}>Select a workout to begin</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upper / Lower Split</Text>

        <Pressable style={styles.templateCard}>
          <View style={styles.templateContent}>
            <Text style={styles.templateName}>Upper A</Text>
            <Text style={styles.templateMeta}>6 exercises</Text>
          </View>
          <Text style={styles.templateLastDone}>Last: --</Text>
        </Pressable>

        <Pressable style={styles.templateCard}>
          <View style={styles.templateContent}>
            <Text style={styles.templateName}>Upper B</Text>
            <Text style={styles.templateMeta}>6 exercises</Text>
          </View>
          <Text style={styles.templateLastDone}>Last: --</Text>
        </Pressable>

        <Pressable style={styles.templateCard}>
          <View style={styles.templateContent}>
            <Text style={styles.templateName}>Lower A</Text>
            <Text style={styles.templateMeta}>5 exercises</Text>
          </View>
          <Text style={styles.templateLastDone}>Last: --</Text>
        </Pressable>

        <Pressable style={styles.templateCard}>
          <View style={styles.templateContent}>
            <Text style={styles.templateName}>Lower B</Text>
            <Text style={styles.templateMeta}>5 exercises</Text>
          </View>
          <Text style={styles.templateLastDone}>Last: --</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  templateCard: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateContent: {
    backgroundColor: 'transparent',
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
  },
  templateMeta: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  templateLastDone: {
    fontSize: 12,
    opacity: 0.5,
  },
});
```

**Step 2: Create history tab screen**

Replace contents of `app/(tabs)/two.tsx` with new file `app/(tabs)/history.tsx`:
```typescript
import { StyleSheet, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function HistoryScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Your past workouts</Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No workouts yet</Text>
        <Text style={styles.emptySubtext}>Complete a workout to see it here</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    marginTop: 8,
  },
});
```

**Step 3: Create insights tab screen**

Create `app/(tabs)/insights.tsx`:
```typescript
import { StyleSheet, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function InsightsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Track your progressive overload</Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Not enough data</Text>
        <Text style={styles.emptySubtext}>Complete some workouts to see insights</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    marginTop: 8,
  },
});
```

**Step 4: Update tab layout**

Modify `app/(tabs)/_layout.tsx`:
```typescript
import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color }) => <TabBarIcon name="heartbeat" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />,
        }}
      />
    </Tabs>
  );
}
```

**Step 5: Delete old files**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && rm app/\(tabs\)/index.tsx app/\(tabs\)/two.tsx
```

**Step 6: Test app navigation**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npx expo start
```

Expected: App shows 3 tabs (Workout, History, Insights) with correct icons

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: update tab navigation with workout, history, insights tabs"
```

---

## Phase 3: Workout Screen with Real Data

### Task 7: Create Workout Template Hooks

**Files:**
- Create: `hooks/useWorkoutTemplates.ts`

**Step 1: Create workout templates hook**

Create `hooks/useWorkoutTemplates.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { workoutTemplates, templateExercises, exercises, workoutSessions } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export type TemplateWithDetails = {
  id: string;
  name: string;
  type: string;
  exerciseCount: number;
  lastPerformed: Date | null;
};

export function useWorkoutTemplates() {
  const [templates, setTemplates] = useState<TemplateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);

      // Get all templates
      const allTemplates = await db.select().from(workoutTemplates);

      // For each template, get exercise count and last performed date
      const templatesWithDetails = await Promise.all(
        allTemplates.map(async (template) => {
          // Count exercises
          const exerciseList = await db
            .select()
            .from(templateExercises)
            .where(eq(templateExercises.templateId, template.id));

          // Get last session
          const lastSession = await db
            .select()
            .from(workoutSessions)
            .where(eq(workoutSessions.templateId, template.id))
            .orderBy(desc(workoutSessions.completedAt))
            .limit(1);

          return {
            id: template.id,
            name: template.name,
            type: template.type,
            exerciseCount: exerciseList.length,
            lastPerformed: lastSession[0]?.completedAt || null,
          };
        })
      );

      setTemplates(templatesWithDetails);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch templates'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, loading, error, refetch: fetchTemplates };
}

export type TemplateExerciseWithDetails = {
  id: string;
  exerciseId: string;
  name: string;
  equipment: string;
  primaryMuscle: string;
  targetRepMin: number;
  targetRepMax: number;
  targetSets: number;
  orderIndex: number;
};

export function useTemplateExercises(templateId: string | null) {
  const [exerciseList, setExerciseList] = useState<TemplateExerciseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!templateId) {
      setExerciseList([]);
      setLoading(false);
      return;
    }

    async function fetchExercises() {
      try {
        setLoading(true);

        const result = await db
          .select({
            id: templateExercises.id,
            exerciseId: templateExercises.exerciseId,
            name: exercises.name,
            equipment: exercises.equipment,
            primaryMuscle: exercises.primaryMuscle,
            targetRepMin: templateExercises.targetRepMin,
            targetRepMax: templateExercises.targetRepMax,
            targetSets: templateExercises.targetSets,
            orderIndex: templateExercises.orderIndex,
          })
          .from(templateExercises)
          .innerJoin(exercises, eq(templateExercises.exerciseId, exercises.id))
          .where(eq(templateExercises.templateId, templateId))
          .orderBy(templateExercises.orderIndex);

        setExerciseList(result);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to fetch exercises'));
      } finally {
        setLoading(false);
      }
    }

    fetchExercises();
  }, [templateId]);

  return { exercises: exerciseList, loading, error };
}
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npx tsc --noEmit
```

Expected: No errors

**Step 3: Commit**

```bash
git add hooks/
git commit -m "feat: add hooks for fetching workout templates"
```

---

### Task 8: Update Workout Screen with Real Data

**Files:**
- Modify: `app/(tabs)/workout.tsx`

**Step 1: Update workout screen to use hooks**

Modify `app/(tabs)/workout.tsx`:
```typescript
import { StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useWorkoutTemplates, TemplateWithDetails } from '@/hooks/useWorkoutTemplates';
import { useRouter } from 'expo-router';

function formatLastPerformed(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function TemplateCard({ template }: { template: TemplateWithDetails }) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/workout/${template.id}`);
  };

  return (
    <Pressable style={styles.templateCard} onPress={handlePress}>
      <View style={styles.templateContent}>
        <Text style={styles.templateName}>{template.name}</Text>
        <Text style={styles.templateMeta}>{template.exerciseCount} exercises</Text>
      </View>
      <Text style={styles.templateLastDone}>Last: {formatLastPerformed(template.lastPerformed)}</Text>
    </Pressable>
  );
}

export default function WorkoutScreen() {
  const { templates, loading, error } = useWorkoutTemplates();

  const upperTemplates = templates.filter(t => t.type === 'upper');
  const lowerTemplates = templates.filter(t => t.type === 'lower');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <Text style={styles.subtitle}>Select a workout to begin</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upper</Text>
        {upperTemplates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lower</Text>
        {lowerTemplates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  templateCard: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateContent: {
    backgroundColor: 'transparent',
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
  },
  templateMeta: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  templateLastDone: {
    fontSize: 12,
    opacity: 0.5,
  },
});
```

**Step 2: Test workout screen shows templates**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npx expo start
```

Expected: Workout screen shows Upper A, Upper B, Lower A, Lower B templates with exercise counts

**Step 3: Commit**

```bash
git add app/\(tabs\)/workout.tsx
git commit -m "feat: workout screen displays templates from database"
```

---

## Phase 4: Active Workout Session

### Task 9: Create Active Workout Screen

**Files:**
- Create: `app/workout/[id].tsx`
- Create: `hooks/useActiveWorkout.ts`

**Step 1: Create active workout hook**

Create `hooks/useActiveWorkout.ts`:
```typescript
import { useState, useCallback, useRef, useEffect } from 'react';
import { db } from '@/db';
import { workoutSessions, setLogs, workoutTemplates } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { TemplateExerciseWithDetails } from './useWorkoutTemplates';

export type SetData = {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  completed: boolean;
};

export type ExerciseProgress = {
  exerciseId: string;
  sets: SetData[];
  lastWeight: number | null;
};

export function useActiveWorkout(templateId: string, exercises: TemplateExerciseWithDetails[]) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Map<string, ExerciseProgress>>(new Map());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start workout timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Initialize session and progress
  useEffect(() => {
    async function init() {
      // Create session
      const newSessionId = `session-${Date.now()}`;
      const template = await db.select().from(workoutTemplates).where(eq(workoutTemplates.id, templateId)).limit(1);

      await db.insert(workoutSessions).values({
        id: newSessionId,
        templateId,
        templateName: template[0]?.name || 'Unknown',
        startedAt: new Date(),
      });

      setSessionId(newSessionId);

      // Initialize progress for each exercise
      const initialProgress = new Map<string, ExerciseProgress>();

      for (const exercise of exercises) {
        // Get last weight used for this exercise
        const lastSet = await db
          .select()
          .from(setLogs)
          .where(eq(setLogs.exerciseId, exercise.exerciseId))
          .orderBy(desc(setLogs.sessionId))
          .limit(1);

        const lastWeight = lastSet[0]?.weight || null;

        // Create empty sets based on target
        const sets: SetData[] = [];
        for (let i = 1; i <= exercise.targetSets; i++) {
          sets.push({
            setNumber: i,
            reps: null,
            weight: null,
            completed: false,
          });
        }

        initialProgress.set(exercise.exerciseId, {
          exerciseId: exercise.exerciseId,
          sets,
          lastWeight,
        });
      }

      setProgress(initialProgress);
    }

    if (exercises.length > 0) {
      init();
    }
  }, [templateId, exercises]);

  // Rest timer countdown
  useEffect(() => {
    if (restSeconds !== null && restSeconds > 0) {
      restTimerRef.current = setTimeout(() => {
        setRestSeconds(s => (s !== null ? s - 1 : null));
      }, 1000);
    }

    return () => {
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
    };
  }, [restSeconds]);

  const logSet = useCallback(async (
    exerciseId: string,
    setNumber: number,
    reps: number,
    weight: number,
    defaultRestSeconds: number
  ) => {
    if (!sessionId) return;

    // Save to database
    await db.insert(setLogs).values({
      id: `set-${Date.now()}-${setNumber}`,
      sessionId,
      exerciseId,
      setNumber,
      reps,
      weight,
      restSeconds: null, // Will be updated when rest completes
    });

    // Update progress
    setProgress(prev => {
      const newProgress = new Map(prev);
      const exerciseProgress = newProgress.get(exerciseId);

      if (exerciseProgress) {
        const updatedSets = exerciseProgress.sets.map(s =>
          s.setNumber === setNumber
            ? { ...s, reps, weight, completed: true }
            : s
        );
        newProgress.set(exerciseId, { ...exerciseProgress, sets: updatedSets });
      }

      return newProgress;
    });

    // Start rest timer
    setRestSeconds(defaultRestSeconds);
  }, [sessionId]);

  const completeWorkout = useCallback(async () => {
    if (!sessionId) return;

    // Update session with completion time
    await db
      .update(workoutSessions)
      .set({
        completedAt: new Date(),
        durationSeconds: elapsedSeconds,
      })
      .where(eq(workoutSessions.id, sessionId));

    if (timerRef.current) clearInterval(timerRef.current);
    setIsComplete(true);
  }, [sessionId, elapsedSeconds]);

  const dismissRestTimer = useCallback(() => {
    setRestSeconds(null);
    if (restTimerRef.current) clearTimeout(restTimerRef.current);
  }, []);

  return {
    sessionId,
    progress,
    elapsedSeconds,
    restSeconds,
    isComplete,
    logSet,
    completeWorkout,
    dismissRestTimer,
  };
}
```

**Step 2: Create active workout screen**

Create `app/workout/[id].tsx`:
```typescript
import { useState } from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTemplateExercises, TemplateExerciseWithDetails } from '@/hooks/useWorkoutTemplates';
import { useActiveWorkout, SetData } from '@/hooks/useActiveWorkout';
import { useColorScheme } from '@/components/useColorScheme';

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type SetRowProps = {
  set: SetData;
  onComplete: (reps: number, weight: number) => void;
  lastWeight: number | null;
  weightUnit: string;
};

function SetRow({ set, onComplete, lastWeight, weightUnit }: SetRowProps) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState(lastWeight?.toString() || '');
  const colorScheme = useColorScheme();
  const inputStyle = colorScheme === 'dark' ? styles.inputDark : styles.inputLight;

  const handleComplete = () => {
    const repsNum = parseInt(reps, 10);
    const weightNum = parseFloat(weight);
    if (!isNaN(repsNum) && !isNaN(weightNum)) {
      onComplete(repsNum, weightNum);
    }
  };

  if (set.completed) {
    return (
      <View style={styles.setRow}>
        <Text style={styles.setNumber}>{set.setNumber}</Text>
        <Text style={styles.setWeight}>{set.weight} {weightUnit}</Text>
        <Text style={styles.setReps}>{set.reps} reps</Text>
        <Text style={styles.checkmark}>✓</Text>
      </View>
    );
  }

  return (
    <View style={styles.setRow}>
      <Text style={styles.setNumber}>{set.setNumber}</Text>
      <TextInput
        style={[styles.input, inputStyle]}
        value={weight}
        onChangeText={setWeight}
        placeholder={weightUnit}
        keyboardType="decimal-pad"
        placeholderTextColor="#999"
      />
      <TextInput
        style={[styles.input, inputStyle]}
        value={reps}
        onChangeText={setReps}
        placeholder="Reps"
        keyboardType="number-pad"
        placeholderTextColor="#999"
      />
      <Pressable style={styles.completeButton} onPress={handleComplete}>
        <Text style={styles.completeButtonText}>✓</Text>
      </Pressable>
    </View>
  );
}

type ExerciseCardProps = {
  exercise: TemplateExerciseWithDetails;
  sets: SetData[];
  lastWeight: number | null;
  onLogSet: (setNumber: number, reps: number, weight: number) => void;
  weightUnit: string;
};

function ExerciseCard({ exercise, sets, lastWeight, onLogSet, weightUnit }: ExerciseCardProps) {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseEquipment}>{EQUIPMENT_LABELS[exercise.equipment]}</Text>
      </View>
      {lastWeight && (
        <Text style={styles.lastWeight}>Last: {lastWeight} {weightUnit}</Text>
      )}
      <Text style={styles.repRange}>{exercise.targetRepMin}-{exercise.targetRepMax} reps</Text>

      <View style={styles.setsContainer}>
        <View style={styles.setHeaderRow}>
          <Text style={styles.setHeaderText}>Set</Text>
          <Text style={styles.setHeaderText}>{weightUnit}</Text>
          <Text style={styles.setHeaderText}>Reps</Text>
          <Text style={styles.setHeaderText}></Text>
        </View>
        {sets.map(set => (
          <SetRow
            key={set.setNumber}
            set={set}
            onComplete={(reps, weight) => onLogSet(set.setNumber, reps, weight)}
            lastWeight={lastWeight}
            weightUnit={weightUnit}
          />
        ))}
      </View>
    </View>
  );
}

export default function ActiveWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { exercises, loading: exercisesLoading } = useTemplateExercises(id || null);

  const {
    progress,
    elapsedSeconds,
    restSeconds,
    isComplete,
    logSet,
    completeWorkout,
    dismissRestTimer,
  } = useActiveWorkout(id || '', exercises);

  const weightUnit = 'kg'; // TODO: Get from settings

  if (exercisesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isComplete) {
    return (
      <View style={styles.completeContainer}>
        <Text style={styles.completeTitle}>Workout Complete!</Text>
        <Text style={styles.completeTime}>Duration: {formatTime(elapsedSeconds)}</Text>
        <Pressable style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
        <Pressable onPress={completeWorkout}>
          <Text style={styles.finishText}>Finish</Text>
        </Pressable>
      </View>

      {restSeconds !== null && restSeconds > 0 && (
        <Pressable style={styles.restOverlay} onPress={dismissRestTimer}>
          <View style={styles.restCard}>
            <Text style={styles.restTitle}>Rest</Text>
            <Text style={styles.restTime}>{formatTime(restSeconds)}</Text>
            <Text style={styles.restTap}>Tap to dismiss</Text>
          </View>
        </Pressable>
      )}

      <ScrollView style={styles.scrollView}>
        {exercises.map(exercise => {
          const exerciseProgress = progress.get(exercise.exerciseId);
          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              sets={exerciseProgress?.sets || []}
              lastWeight={exerciseProgress?.lastWeight || null}
              onLogSet={(setNumber, reps, weight) =>
                logSet(exercise.exerciseId, setNumber, reps, weight, 90)
              }
              weightUnit={weightUnit}
            />
          );
        })}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  cancelText: {
    color: '#ff4444',
    fontSize: 16,
  },
  timer: {
    fontSize: 20,
    fontWeight: '600',
  },
  finishText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  exerciseCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
  },
  exerciseEquipment: {
    fontSize: 14,
    opacity: 0.7,
  },
  lastWeight: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  repRange: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  setsContainer: {
    marginTop: 12,
  },
  setHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  setHeaderText: {
    flex: 1,
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  setNumber: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  setWeight: {
    flex: 1,
    textAlign: 'center',
  },
  setReps: {
    flex: 1,
    textAlign: 'center',
  },
  checkmark: {
    flex: 1,
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: 18,
  },
  input: {
    flex: 1,
    marginHorizontal: 4,
    padding: 8,
    borderRadius: 8,
    textAlign: 'center',
  },
  inputLight: {
    backgroundColor: '#fff',
    color: '#000',
  },
  inputDark: {
    backgroundColor: '#333',
    color: '#fff',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
    marginLeft: 4,
  },
  completeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  restOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  restCard: {
    backgroundColor: '#333',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  restTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  restTime: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 20,
  },
  restTap: {
    fontSize: 14,
    color: '#999',
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  completeTime: {
    fontSize: 18,
    opacity: 0.7,
    marginTop: 8,
  },
  doneButton: {
    marginTop: 40,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});
```

**Step 3: Add workout route to stack**

Modify `app/_layout.tsx` to include workout route in Stack:

Add after the modal Screen:
```typescript
<Stack.Screen name="workout/[id]" options={{ presentation: 'modal', headerShown: false }} />
```

**Step 4: Test active workout flow**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npx expo start
```

Expected: Tap template → opens active workout → can log sets → rest timer shows → can complete workout

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add active workout screen with set logging and timers"
```

---

## Phase 5: History Screen

### Task 10: Create History Hook and Update Screen

**Files:**
- Create: `hooks/useWorkoutHistory.ts`
- Modify: `app/(tabs)/history.tsx`

**Step 1: Create history hook**

Create `hooks/useWorkoutHistory.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { workoutSessions, setLogs, exercises } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export type WorkoutHistoryItem = {
  id: string;
  templateName: string;
  completedAt: Date;
  durationSeconds: number;
  exerciseCount: number;
  totalSets: number;
  totalVolume: number;
};

export function useWorkoutHistory() {
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);

      const sessions = await db
        .select()
        .from(workoutSessions)
        .where(eq(workoutSessions.completedAt, workoutSessions.completedAt)) // Only completed
        .orderBy(desc(workoutSessions.completedAt));

      const historyItems = await Promise.all(
        sessions
          .filter(s => s.completedAt !== null)
          .map(async session => {
            const sets = await db
              .select()
              .from(setLogs)
              .where(eq(setLogs.sessionId, session.id));

            const uniqueExercises = new Set(sets.map(s => s.exerciseId));
            const totalVolume = sets.reduce((sum, s) => sum + (s.weight * s.reps), 0);

            return {
              id: session.id,
              templateName: session.templateName,
              completedAt: session.completedAt!,
              durationSeconds: session.durationSeconds || 0,
              exerciseCount: uniqueExercises.size,
              totalSets: sets.length,
              totalVolume: Math.round(totalVolume),
            };
          })
      );

      setHistory(historyItems);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch history'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
}
```

**Step 2: Update history screen**

Modify `app/(tabs)/history.tsx`:
```typescript
import { StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useWorkoutHistory, WorkoutHistoryItem } from '@/hooks/useWorkoutHistory';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

function HistoryCard({ item }: { item: WorkoutHistoryItem }) {
  return (
    <Pressable style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.templateName}>{item.templateName}</Text>
        <Text style={styles.date}>{formatDate(item.completedAt)}</Text>
      </View>
      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDuration(item.durationSeconds)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.exerciseCount}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.totalSets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.totalVolume}</Text>
          <Text style={styles.statLabel}>Volume (kg)</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const { history, loading, error, refetch } = useWorkoutHistory();

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Your past workouts</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptySubtext}>Complete a workout to see it here</Text>
        </View>
      ) : (
        <View style={styles.historyList}>
          {history.map(item => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    marginTop: 8,
  },
  historyList: {
    padding: 20,
    paddingTop: 0,
  },
  historyCard: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    opacity: 0.7,
  },
  cardStats: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
});
```

**Step 3: Test history screen**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npx expo start
```

Expected: After completing a workout, history tab shows the workout with stats

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add workout history screen with stats"
```

---

## Phase 6: Insights Screen - Progressive Overload

### Task 11: Create Progressive Overload Hook and Update Insights Screen

**Files:**
- Create: `hooks/useProgressiveOverload.ts`
- Modify: `app/(tabs)/insights.tsx`

**Step 1: Create progressive overload hook**

Create `hooks/useProgressiveOverload.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { exercises, setLogs, workoutSessions, templateExercises } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export type ProgressStatus = 'progressing' | 'maintaining' | 'stalled';

export type ExerciseProgress = {
  exerciseId: string;
  exerciseName: string;
  equipment: string;
  targetRepMin: number;
  targetRepMax: number;
  currentWeight: number | null;
  lastSessionReps: number[];
  previousSessionReps: number[];
  status: ProgressStatus;
  sessionsAtCurrentWeight: number;
  readyToIncrease: boolean;
};

function determineStatus(
  lastReps: number[],
  prevReps: number[],
  targetMax: number,
  sessionsAtWeight: number
): { status: ProgressStatus; readyToIncrease: boolean } {
  if (lastReps.length === 0) {
    return { status: 'maintaining', readyToIncrease: false };
  }

  // Check if all reps hit target max
  const allHitMax = lastReps.every(r => r >= targetMax);
  if (allHitMax) {
    return { status: 'progressing', readyToIncrease: true };
  }

  // Check if stalled (3+ sessions at same weight without progress)
  if (sessionsAtWeight >= 3) {
    // Compare to previous session
    if (prevReps.length > 0) {
      const lastTotal = lastReps.reduce((a, b) => a + b, 0);
      const prevTotal = prevReps.reduce((a, b) => a + b, 0);
      if (lastTotal <= prevTotal) {
        return { status: 'stalled', readyToIncrease: false };
      }
    } else {
      return { status: 'stalled', readyToIncrease: false };
    }
  }

  // Check for progression (more reps than previous)
  if (prevReps.length > 0) {
    const lastTotal = lastReps.reduce((a, b) => a + b, 0);
    const prevTotal = prevReps.reduce((a, b) => a + b, 0);
    if (lastTotal > prevTotal) {
      return { status: 'progressing', readyToIncrease: false };
    }
  }

  return { status: 'maintaining', readyToIncrease: false };
}

export function useProgressiveOverload() {
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);

      // Get all exercises that have been used in templates
      const templateExercisesList = await db
        .select({
          exerciseId: templateExercises.exerciseId,
          targetRepMin: templateExercises.targetRepMin,
          targetRepMax: templateExercises.targetRepMax,
        })
        .from(templateExercises);

      // Get unique exercise IDs
      const exerciseIds = [...new Set(templateExercisesList.map(te => te.exerciseId))];

      const progressList: ExerciseProgress[] = [];

      for (const exerciseId of exerciseIds) {
        // Get exercise details
        const exerciseDetails = await db
          .select()
          .from(exercises)
          .where(eq(exercises.id, exerciseId))
          .limit(1);

        if (exerciseDetails.length === 0) continue;

        const exercise = exerciseDetails[0];
        const templateEx = templateExercisesList.find(te => te.exerciseId === exerciseId);
        if (!templateEx) continue;

        // Get all sessions with this exercise, ordered by date
        const sessionsWithExercise = await db
          .select({
            sessionId: setLogs.sessionId,
            weight: setLogs.weight,
            reps: setLogs.reps,
            setNumber: setLogs.setNumber,
          })
          .from(setLogs)
          .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
          .where(eq(setLogs.exerciseId, exerciseId))
          .orderBy(desc(workoutSessions.completedAt), setLogs.setNumber);

        if (sessionsWithExercise.length === 0) {
          progressList.push({
            exerciseId,
            exerciseName: exercise.name,
            equipment: exercise.equipment,
            targetRepMin: templateEx.targetRepMin,
            targetRepMax: templateEx.targetRepMax,
            currentWeight: null,
            lastSessionReps: [],
            previousSessionReps: [],
            status: 'maintaining',
            sessionsAtCurrentWeight: 0,
            readyToIncrease: false,
          });
          continue;
        }

        // Group by session
        const sessionGroups = new Map<string, { weight: number; reps: number[] }>();
        for (const row of sessionsWithExercise) {
          const existing = sessionGroups.get(row.sessionId);
          if (existing) {
            existing.reps.push(row.reps);
          } else {
            sessionGroups.set(row.sessionId, { weight: row.weight, reps: [row.reps] });
          }
        }

        const sessions = Array.from(sessionGroups.values());
        const lastSession = sessions[0];
        const prevSession = sessions[1];

        // Count sessions at current weight
        let sessionsAtWeight = 0;
        for (const session of sessions) {
          if (session.weight === lastSession.weight) {
            sessionsAtWeight++;
          } else {
            break;
          }
        }

        const { status, readyToIncrease } = determineStatus(
          lastSession.reps,
          prevSession?.reps || [],
          templateEx.targetRepMax,
          sessionsAtWeight
        );

        progressList.push({
          exerciseId,
          exerciseName: exercise.name,
          equipment: exercise.equipment,
          targetRepMin: templateEx.targetRepMin,
          targetRepMax: templateEx.targetRepMax,
          currentWeight: lastSession.weight,
          lastSessionReps: lastSession.reps,
          previousSessionReps: prevSession?.reps || [],
          status,
          sessionsAtCurrentWeight: sessionsAtWeight,
          readyToIncrease,
        });
      }

      // Sort: stalled first, then progressing, then maintaining
      progressList.sort((a, b) => {
        const order = { stalled: 0, progressing: 1, maintaining: 2 };
        return order[a.status] - order[b.status];
      });

      setExerciseProgress(progressList);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch progress'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { exerciseProgress, loading, error, refetch: fetchProgress };
}
```

**Step 2: Update insights screen**

Modify `app/(tabs)/insights.tsx`:
```typescript
import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useProgressiveOverload, ExerciseProgress, ProgressStatus } from '@/hooks/useProgressiveOverload';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

const STATUS_COLORS: Record<ProgressStatus, string> = {
  progressing: '#4CAF50',
  maintaining: '#FFC107',
  stalled: '#f44336',
};

const STATUS_LABELS: Record<ProgressStatus, string> = {
  progressing: 'Progressing',
  maintaining: 'Maintaining',
  stalled: 'Stalled',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
};

function ExerciseProgressCard({ progress }: { progress: ExerciseProgress }) {
  const statusColor = STATUS_COLORS[progress.status];

  return (
    <View style={styles.progressCard}>
      <View style={styles.cardHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{progress.exerciseName}</Text>
          <Text style={styles.exerciseEquipment}>{EQUIPMENT_LABELS[progress.equipment]}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[progress.status]}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.repRange}>
          Target: {progress.targetRepMin}-{progress.targetRepMax} reps
        </Text>

        {progress.currentWeight !== null ? (
          <>
            <Text style={styles.currentWeight}>
              Current: {progress.currentWeight} kg
            </Text>
            <Text style={styles.lastSession}>
              Last session: {progress.lastSessionReps.join(', ')} reps
            </Text>
            {progress.sessionsAtCurrentWeight > 1 && (
              <Text style={styles.sessionsAtWeight}>
                {progress.sessionsAtCurrentWeight} sessions at this weight
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.noData}>No data yet</Text>
        )}

        {progress.readyToIncrease && (
          <View style={styles.recommendation}>
            <Text style={styles.recommendationText}>
              ✓ Ready to increase weight
            </Text>
          </View>
        )}

        {progress.status === 'stalled' && (
          <View style={[styles.recommendation, styles.stalledRecommendation]}>
            <Text style={styles.stalledText}>
              ⚠️ Consider deload or variation
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const { exerciseProgress, loading, error, refetch } = useProgressiveOverload();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  const progressing = exerciseProgress.filter(e => e.status === 'progressing');
  const maintaining = exerciseProgress.filter(e => e.status === 'maintaining');
  const stalled = exerciseProgress.filter(e => e.status === 'stalled');

  const hasData = exerciseProgress.some(e => e.currentWeight !== null);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progressive Overload</Text>
        <Text style={styles.subtitle}>Track your double progression</Text>
      </View>

      {!hasData ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Not enough data</Text>
          <Text style={styles.emptySubtext}>Complete some workouts to see insights</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {stalled.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠️ Stalled ({stalled.length})</Text>
              {stalled.map(p => (
                <ExerciseProgressCard key={p.exerciseId} progress={p} />
              ))}
            </View>
          )}

          {progressing.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✓ Progressing ({progressing.length})</Text>
              {progressing.map(p => (
                <ExerciseProgressCard key={p.exerciseId} progress={p} />
              ))}
            </View>
          )}

          {maintaining.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>→ Maintaining ({maintaining.length})</Text>
              {maintaining.map(p => (
                <ExerciseProgressCard key={p.exerciseId} progress={p} />
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    marginTop: 8,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  exerciseInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseEquipment: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  repRange: {
    fontSize: 14,
    opacity: 0.7,
  },
  currentWeight: {
    fontSize: 14,
    marginTop: 4,
  },
  lastSession: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  sessionsAtWeight: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  noData: {
    fontSize: 14,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  recommendation: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 8,
  },
  recommendationText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  stalledRecommendation: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  stalledText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '500',
  },
});
```

**Step 3: Test insights screen**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npx expo start
```

Expected: After completing workouts, insights tab shows progressive overload status for each exercise

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add progressive overload insights screen"
```

---

## Phase 7: Settings

### Task 12: Create Settings Screen

**Files:**
- Create: `app/settings.tsx`
- Create: `hooks/useSettings.ts`
- Modify: `app/(tabs)/workout.tsx` (add settings button)
- Modify: `app/_layout.tsx` (add settings route)

**Step 1: Create settings hook**

Create `hooks/useSettings.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { userSettings, UserSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const result = await db.select().from(userSettings).where(eq(userSettings.id, 'default')).limit(1);
      setSettings(result[0] || null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    await db.update(userSettings).set({ [key]: value }).where(eq(userSettings.id, 'default'));
    await fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, updateSetting, refetch: fetchSettings };
}
```

**Step 2: Create settings screen**

Create `app/settings.tsx`:
```typescript
import { StyleSheet, Pressable, Switch } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useSettings } from '@/hooks/useSettings';
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, loading, updateSetting } = useSettings();
  const colorScheme = useColorScheme();

  if (loading || !settings) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Units</Text>
        <Pressable
          style={styles.settingRow}
          onPress={() => updateSetting('weightUnit', settings.weightUnit === 'kg' ? 'lbs' : 'kg')}
        >
          <Text style={styles.settingLabel}>Weight Unit</Text>
          <Text style={styles.settingValue}>{settings.weightUnit.toUpperCase()}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rest Timer</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Default Rest (seconds)</Text>
          <View style={styles.restButtons}>
            {[60, 90, 120, 180].map(seconds => (
              <Pressable
                key={seconds}
                style={[
                  styles.restButton,
                  settings.defaultRestSeconds === seconds && styles.restButtonActive,
                ]}
                onPress={() => updateSetting('defaultRestSeconds', seconds)}
              >
                <Text
                  style={[
                    styles.restButtonText,
                    settings.defaultRestSeconds === seconds && styles.restButtonTextActive,
                  ]}
                >
                  {seconds}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Pressable
          style={styles.settingRow}
          onPress={() => {
            const themes = ['system', 'light', 'dark'];
            const currentIndex = themes.indexOf(settings.theme);
            const nextTheme = themes[(currentIndex + 1) % themes.length];
            updateSetting('theme', nextTheme);
          }}
        >
          <Text style={styles.settingLabel}>Theme</Text>
          <Text style={styles.settingValue}>
            {settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    fontSize: 16,
    color: '#2f95dc',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 50,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
    opacity: 0.7,
  },
  restButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  restButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  restButtonActive: {
    backgroundColor: '#2f95dc',
  },
  restButtonText: {
    fontSize: 14,
  },
  restButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
```

**Step 3: Add settings route to layout**

Modify `app/_layout.tsx` - add after the workout/[id] Screen:
```typescript
<Stack.Screen name="settings" options={{ presentation: 'modal', headerShown: false }} />
```

**Step 4: Add settings button to workout screen**

Modify `app/(tabs)/workout.tsx` - add a settings button in the header:

Add to header View:
```typescript
<View style={styles.header}>
  <View style={styles.headerTop}>
    <Text style={styles.title}>Workouts</Text>
    <Pressable onPress={() => router.push('/settings')}>
      <Text style={styles.settingsButton}>⚙️</Text>
    </Pressable>
  </View>
  <Text style={styles.subtitle}>Select a workout to begin</Text>
</View>
```

Add styles:
```typescript
headerTop: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: 'transparent',
},
settingsButton: {
  fontSize: 24,
},
```

**Step 5: Test settings screen**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npx expo start
```

Expected: Settings icon in workout screen → opens settings → can change units and rest timer

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add settings screen with unit and rest timer preferences"
```

---

## Phase 8: Integration & Polish

### Task 13: Wire Up Settings Throughout App

**Files:**
- Modify: `app/workout/[id].tsx` - use settings for weight unit and rest timer
- Modify: `app/(tabs)/history.tsx` - use weight unit from settings
- Modify: `app/(tabs)/insights.tsx` - use weight unit from settings

**Step 1: Update active workout to use settings**

In `app/workout/[id].tsx`:
- Import useSettings
- Use settings.weightUnit instead of hardcoded 'kg'
- Use settings.defaultRestSeconds for rest timer

**Step 2: Update history to use settings**

In `app/(tabs)/history.tsx`:
- Import useSettings
- Use settings.weightUnit for volume display

**Step 3: Update insights to use settings**

In `app/(tabs)/insights.tsx`:
- Import useSettings
- Use settings.weightUnit for weight display

**Step 4: Test full flow**

Run:
```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && npx expo start
```

Expected: Changing weight unit in settings updates display throughout app

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: integrate settings throughout app"
```

---

### Task 14: Final Testing and Cleanup

**Step 1: Test complete user flow**

1. Open app → see workout templates
2. Tap Upper A → start workout
3. Log sets for each exercise
4. Rest timer appears between sets
5. Complete workout
6. Check History tab → workout appears
7. Check Insights tab → progressive overload status shown
8. Change settings → units update everywhere

**Step 2: Remove unused template files**

```bash
cd /Users/viralmakwana/Documents/claude-projects/gym-track && rm -f components/EditScreenInfo.tsx components/StyledText.tsx app/modal.tsx
```

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: cleanup unused template files"
```

---

## Summary

**Total Tasks:** 14

**Phase 1 - Foundation (Tasks 1-5):**
- Database dependencies
- Schema definition
- Migrations and seed data
- Database context provider
- App integration

**Phase 2 - Navigation (Task 6):**
- Three-tab structure (Workout, History, Insights)

**Phase 3 - Workout Screen (Tasks 7-8):**
- Template hooks
- Real data display

**Phase 4 - Active Workout (Task 9):**
- Active workout screen
- Set logging
- Timers

**Phase 5 - History (Task 10):**
- Workout history display

**Phase 6 - Insights (Task 11):**
- Progressive overload tracking

**Phase 7 - Settings (Task 12):**
- Settings screen
- Unit preferences
- Rest timer defaults

**Phase 8 - Integration (Tasks 13-14):**
- Wire up settings
- Final testing and cleanup
