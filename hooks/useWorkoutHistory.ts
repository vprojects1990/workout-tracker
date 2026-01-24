import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { workoutSessions, setLogs, exercises } from '@/db/schema';
import { eq, desc, isNotNull, and, lt, inArray } from 'drizzle-orm';

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
        .where(isNotNull(workoutSessions.completedAt))
        .orderBy(desc(workoutSessions.completedAt));

      const historyItems = await Promise.all(
        sessions.map(async session => {
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

export type ExerciseDetail = {
  exerciseId: string;
  name: string;
  equipment: string;
  sets: Array<{ reps: number; weight: number }>;
  maxWeight: number;
  isPR: boolean;
};

export function useWorkoutDetails(sessionId: string | null) {
  const [details, setDetails] = useState<ExerciseDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setDetails([]);
      return;
    }

    const currentSessionId = sessionId;

    async function fetchDetails() {
      try {
        setLoading(true);

        // Get session to know the date
        const sessions = await db
          .select()
          .from(workoutSessions)
          .where(eq(workoutSessions.id, currentSessionId))
          .limit(1);

        const session = sessions[0];
        if (!session) {
          setDetails([]);
          return;
        }

        // Get all set logs for this session
        const logs = await db
          .select({
            exerciseId: setLogs.exerciseId,
            reps: setLogs.reps,
            weight: setLogs.weight,
            setNumber: setLogs.setNumber,
          })
          .from(setLogs)
          .where(eq(setLogs.sessionId, currentSessionId))
          .orderBy(setLogs.setNumber);

        // Get unique exercise IDs
        const exerciseIds = [...new Set(logs.map(l => l.exerciseId))];

        // Get exercise details
        const exerciseDetails = await Promise.all(
          exerciseIds.map(async (exerciseId) => {
            const exerciseData = await db
              .select()
              .from(exercises)
              .where(eq(exercises.id, exerciseId))
              .limit(1);

            const exercise = exerciseData[0];
            const exerciseLogs = logs.filter(l => l.exerciseId === exerciseId);
            const maxWeight = Math.max(...exerciseLogs.map(l => l.weight));

            // Check if this is a PR by looking at all previous sessions
            const previousMaxWeight = await getPreviousMaxWeight(exerciseId, session.startedAt);
            const isPR = maxWeight > previousMaxWeight;

            return {
              exerciseId,
              name: exercise?.name || 'Unknown',
              equipment: exercise?.equipment || 'unknown',
              sets: exerciseLogs.map(l => ({ reps: l.reps, weight: l.weight })),
              maxWeight,
              isPR,
            };
          })
        );

        setDetails(exerciseDetails);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to fetch details'));
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [sessionId]);

  return { details, loading, error };
}

async function getPreviousMaxWeight(exerciseId: string, beforeDate: Date): Promise<number> {
  try {
    // Get all sessions before this date
    const previousSessions = await db
      .select({ id: workoutSessions.id })
      .from(workoutSessions)
      .where(lt(workoutSessions.startedAt, beforeDate));

    if (previousSessions.length === 0) return 0;

    // Get max weight from all previous sessions for this exercise
    let maxWeight = 0;
    for (const session of previousSessions) {
      const logs = await db
        .select({ weight: setLogs.weight })
        .from(setLogs)
        .where(
          and(
            eq(setLogs.sessionId, session.id),
            eq(setLogs.exerciseId, exerciseId)
          )
        );

      for (const log of logs) {
        if (log.weight > maxWeight) {
          maxWeight = log.weight;
        }
      }
    }

    return maxWeight;
  } catch {
    return 0;
  }
}

// Hook for history mutations
export function useHistoryMutations() {
  async function deleteWorkoutSession(sessionId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete all set logs for this session
      await tx
        .delete(setLogs)
        .where(eq(setLogs.sessionId, sessionId));

      // Delete the session itself
      await tx
        .delete(workoutSessions)
        .where(eq(workoutSessions.id, sessionId));
    });
  }

  return { deleteWorkoutSession };
}
