import { db } from '@/db';
import {
  exercises,
  templateExercises,
  workoutSessions,
  setLogs,
} from '@/db/schema';
import type { Exercise } from '@/db/schema';
import { eq, and, inArray, lt, sql } from 'drizzle-orm';

// ============================================================================
// Template Queries
// ============================================================================

/**
 * Batch-fetch exercise counts and last-performed dates for a list of templates.
 * Extracted from useWorkoutTemplates (was local `fetchTemplateDetails`) and
 * useWorkoutDashboard (was inline duplicate).
 */
export function fetchTemplateDetails(templateIds: string[]): {
  exerciseCounts: Map<string, number>;
  lastPerformed: Map<string, Date | null>;
} {
  if (templateIds.length === 0) {
    return { exerciseCounts: new Map(), lastPerformed: new Map() };
  }

  const exerciseCountResults = db
    .select({
      templateId: templateExercises.templateId,
      count: sql<number>`COUNT(*)`,
    })
    .from(templateExercises)
    .where(inArray(templateExercises.templateId, templateIds))
    .groupBy(templateExercises.templateId)
    .all();

  const exerciseCounts = new Map(
    exerciseCountResults.map(r => [r.templateId, r.count])
  );

  const lastSessions = db
    .select({
      templateId: workoutSessions.templateId,
      completedAt: sql<number>`MAX(${workoutSessions.completedAt})`,
    })
    .from(workoutSessions)
    .where(inArray(workoutSessions.templateId, templateIds))
    .groupBy(workoutSessions.templateId)
    .all();

  // SQL aggregates on timestamp columns return raw epoch seconds
  const lastPerformed = new Map(
    lastSessions.map(s => [
      s.templateId!,
      s.completedAt ? new Date(s.completedAt * 1000) : null,
    ])
  );

  return { exerciseCounts, lastPerformed };
}

/**
 * Fetch template exercises with joined exercise details for a single template.
 * Used by useTemplateExercises and useProgressiveOverload.
 */
export function fetchTemplateExercisesWithDetails(templateId: string) {
  return db
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
    .orderBy(templateExercises.orderIndex)
    .all();
}

// ============================================================================
// Exercise Queries
// ============================================================================

/**
 * Fetch exercises by an array of IDs.
 * Used by useWorkoutHistory, ActiveWorkoutContext, and useProgressiveOverload.
 */
export function fetchExercisesByIds(exerciseIds: string[]): Exercise[] {
  if (exerciseIds.length === 0) return [];

  return db
    .select()
    .from(exercises)
    .where(inArray(exercises.id, exerciseIds))
    .all();
}

// ============================================================================
// Set Log Queries
// ============================================================================

export type SessionStats = {
  exerciseCount: number;
  totalSets: number;
  totalVolume: number;
};

/**
 * Batch-fetch aggregated set stats (exercise count, total sets, volume) for
 * multiple sessions. Used by useWorkoutHistory.
 */
export function fetchSessionSetStats(
  sessionIds: string[]
): Map<string, SessionStats> {
  if (sessionIds.length === 0) return new Map();

  const stats = db
    .select({
      sessionId: setLogs.sessionId,
      exerciseCount: sql<number>`COUNT(DISTINCT ${setLogs.exerciseId})`,
      totalSets: sql<number>`COUNT(*)`,
      totalVolume: sql<number>`COALESCE(SUM(${setLogs.weight} * ${setLogs.reps}), 0)`,
    })
    .from(setLogs)
    .where(inArray(setLogs.sessionId, sessionIds))
    .groupBy(setLogs.sessionId)
    .all();

  return new Map(
    stats.map(s => [
      s.sessionId,
      {
        exerciseCount: s.exerciseCount,
        totalSets: s.totalSets,
        totalVolume: s.totalVolume,
      },
    ])
  );
}

/**
 * Batch-fetch previous max weights for exercises before a given date.
 * Used by useWorkoutDetails for PR detection.
 */
export function fetchPreviousMaxWeights(
  exerciseIds: string[],
  beforeDate: Date
): Map<string, number> {
  if (exerciseIds.length === 0) return new Map();

  const results = db
    .select({
      exerciseId: setLogs.exerciseId,
      maxWeight: sql<number>`MAX(${setLogs.weight})`,
    })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .where(
      and(
        inArray(setLogs.exerciseId, exerciseIds),
        lt(workoutSessions.startedAt, beforeDate)
      )
    )
    .groupBy(setLogs.exerciseId)
    .all();

  return new Map(results.map(r => [r.exerciseId, r.maxWeight]));
}
