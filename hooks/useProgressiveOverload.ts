import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { exercises, setLogs, workoutSessions, templateExercises } from '@/db/schema';
import { eq, desc, isNotNull, and, inArray } from 'drizzle-orm';

export type ProgressStatus = 'progressing' | 'maintaining' | 'stalled';

export type SourceWorkout = {
  sessionId: string;
  templateName: string | null;
  date: Date;
  maxWeight: number;
};

export type ExerciseProgress = {
  exerciseId: string;
  exerciseName: string;
  equipment: string;
  primaryMuscle: string;
  targetRepMin: number | null;
  targetRepMax: number | null;
  currentWeight: number | null;
  lastSessionReps: number[];
  previousSessionReps: number[];
  status: ProgressStatus;
  sessionsAtCurrentWeight: number;
  readyToIncrease: boolean;
  sourceWorkouts: SourceWorkout[];
};

export type ProgressiveOverloadOptions = {
  sessionId?: string;
  templateId?: string;
};

export function determineStatus(
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

export function useProgressiveOverload(options?: ProgressiveOverloadOptions) {
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

      if (exerciseIds.length === 0) {
        setExerciseProgress([]);
        setError(null);
        return;
      }

      // Batch query: Get all exercise details in one query
      const exerciseDetailsList = await db
        .select()
        .from(exercises)
        .where(inArray(exercises.id, exerciseIds));

      const exerciseMap = new Map(exerciseDetailsList.map(e => [e.id, e]));

      // Fetch sessions once (same for all exercises based on options)
      let completedSessions: { id: string; completedAt: Date | null; templateId: string | null; templateName: string }[];

      if (options?.sessionId) {
        completedSessions = await db
          .select({
            id: workoutSessions.id,
            completedAt: workoutSessions.completedAt,
            templateId: workoutSessions.templateId,
            templateName: workoutSessions.templateName,
          })
          .from(workoutSessions)
          .where(and(
            isNotNull(workoutSessions.completedAt),
            eq(workoutSessions.id, options.sessionId)
          ))
          .orderBy(desc(workoutSessions.completedAt));
      } else if (options?.templateId) {
        completedSessions = await db
          .select({
            id: workoutSessions.id,
            completedAt: workoutSessions.completedAt,
            templateId: workoutSessions.templateId,
            templateName: workoutSessions.templateName,
          })
          .from(workoutSessions)
          .where(and(
            isNotNull(workoutSessions.completedAt),
            eq(workoutSessions.templateId, options.templateId)
          ))
          .orderBy(desc(workoutSessions.completedAt));
      } else {
        completedSessions = await db
          .select({
            id: workoutSessions.id,
            completedAt: workoutSessions.completedAt,
            templateId: workoutSessions.templateId,
            templateName: workoutSessions.templateName,
          })
          .from(workoutSessions)
          .where(isNotNull(workoutSessions.completedAt))
          .orderBy(desc(workoutSessions.completedAt));
      }

      const sessionIds = completedSessions.map(s => s.id);
      const sessionMap = new Map(completedSessions.map(s => [s.id, s]));

      // Batch query: Get all set logs for all exercises in all sessions at once
      const allSetLogs = sessionIds.length > 0 && exerciseIds.length > 0
        ? await db
            .select()
            .from(setLogs)
            .where(
              and(
                inArray(setLogs.sessionId, sessionIds),
                inArray(setLogs.exerciseId, exerciseIds)
              )
            )
        : [];

      // Group set logs by exerciseId for efficient lookup
      const setLogsByExercise = new Map<string, typeof allSetLogs>();
      for (const log of allSetLogs) {
        const existing = setLogsByExercise.get(log.exerciseId);
        if (existing) {
          existing.push(log);
        } else {
          setLogsByExercise.set(log.exerciseId, [log]);
        }
      }

      const progressList: ExerciseProgress[] = [];

      // Process each exercise using the pre-fetched data (no additional queries)
      for (const exerciseId of exerciseIds) {
        const exercise = exerciseMap.get(exerciseId);
        if (!exercise) continue;

        const templateEx = templateExercisesList.find(te => te.exerciseId === exerciseId);
        if (!templateEx) continue;

        const exerciseSets = setLogsByExercise.get(exerciseId) || [];

        const allSets: {
          sessionId: string;
          weight: number;
          reps: number;
          completedAt: Date;
          templateName: string;
        }[] = exerciseSets
          .filter(set => sessionMap.has(set.sessionId))
          .map(set => {
            const session = sessionMap.get(set.sessionId)!;
            return {
              sessionId: set.sessionId,
              weight: set.weight,
              reps: set.reps,
              completedAt: session.completedAt!,
              templateName: session.templateName,
            };
          });

        if (allSets.length === 0) {
          progressList.push({
            exerciseId,
            exerciseName: exercise.name,
            equipment: exercise.equipment,
            primaryMuscle: exercise.primaryMuscle,
            targetRepMin: templateEx.targetRepMin,
            targetRepMax: templateEx.targetRepMax,
            currentWeight: null,
            lastSessionReps: [],
            previousSessionReps: [],
            status: 'maintaining',
            sessionsAtCurrentWeight: 0,
            readyToIncrease: false,
            sourceWorkouts: [],
          });
          continue;
        }

        // Group by session and track source workouts
        const sessionGroups = new Map<string, {
          weight: number;
          reps: number[];
          completedAt: Date;
          templateName: string;
          maxWeight: number;
        }>();

        for (const set of allSets) {
          const existing = sessionGroups.get(set.sessionId);
          if (existing) {
            existing.reps.push(set.reps);
            existing.maxWeight = Math.max(existing.maxWeight, set.weight);
          } else {
            sessionGroups.set(set.sessionId, {
              weight: set.weight,
              reps: [set.reps],
              completedAt: set.completedAt,
              templateName: set.templateName,
              maxWeight: set.weight,
            });
          }
        }

        // Build sourceWorkouts array
        const sourceWorkouts: SourceWorkout[] = Array.from(sessionGroups.entries()).map(
          ([sessionId, data]) => ({
            sessionId,
            templateName: data.templateName || null,
            date: data.completedAt,
            maxWeight: data.maxWeight,
          })
        );

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
          templateEx.targetRepMax ?? 12,
          sessionsAtWeight
        );

        progressList.push({
          exerciseId,
          exerciseName: exercise.name,
          equipment: exercise.equipment,
          primaryMuscle: exercise.primaryMuscle,
          targetRepMin: templateEx.targetRepMin,
          targetRepMax: templateEx.targetRepMax,
          currentWeight: lastSession.weight,
          lastSessionReps: lastSession.reps,
          previousSessionReps: prevSession?.reps || [],
          status,
          sessionsAtCurrentWeight: sessionsAtWeight,
          readyToIncrease,
          sourceWorkouts,
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
  }, [options?.sessionId, options?.templateId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { exerciseProgress, loading, error, refetch: fetchProgress };
}
