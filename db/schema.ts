import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Workout splits - containers for workout templates (e.g., "4-Day Upper/Lower")
export const workoutSplits = sqliteTable('workout_splits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

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
  splitId: text('split_id').references(() => workoutSplits.id), // null for standalone workouts
  name: text('name').notNull(),
  type: text('type').notNull(), // upper | lower | custom
  orderIndex: integer('order_index').notNull().default(0),
  dayOfWeek: integer('day_of_week'), // 0=Mon, 1=Tue, ..., 6=Sun (nullable for backwards compat)
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
export type WorkoutSplit = typeof workoutSplits.$inferSelect;
export type NewWorkoutSplit = typeof workoutSplits.$inferInsert;
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
