import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { workoutSessions, setLogs, exercises } from '@/db/schema';
import { eq, desc, isNotNull, and, lt, inArray, sql } from 'drizzle-orm';

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

      // Get all completed sessions
      const sessions = await db
        .select()
        .from(workoutSessions)
        .where(isNotNull(workoutSessions.completedAt))
        .orderBy(desc(workoutSessions.completedAt));

      if (sessions.length === 0) {
        setHistory([]);
        setError(null);
        return;
      }

      // Batch query: Get aggregated set data for all sessions in one query
      const sessionIds = sessions.map(s => s.id);
      const setStats = await db
        .select({
          sessionId: setLogs.sessionId,
          exerciseCount: sql<number>`COUNT(DISTINCT ${setLogs.exerciseId})`,
          totalSets: sql<number>`COUNT(*)`,
          totalVolume: sql<number>`COALESCE(SUM(${setLogs.weight} * ${setLogs.reps}), 0)`,
        })
        .from(setLogs)
        .where(inArray(setLogs.sessionId, sessionIds))
        .groupBy(setLogs.sessionId);

      // Create a lookup map for O(1) access
      const statsMap = new Map(setStats.map(s => [s.sessionId, s]));

      // Build history items without additional queries
      const historyItems: WorkoutHistoryItem[] = sessions
        .filter(session => session.completedAt !== null)
        .map(session => {
          const stats = statsMap.get(session.id);
          return {
            id: session.id,
            templateName: session.templateName,
            completedAt: session.completedAt!,
            durationSeconds: session.durationSeconds || 0,
            exerciseCount: stats?.exerciseCount ?? 0,
            totalSets: stats?.totalSets ?? 0,
            totalVolume: Math.round(stats?.totalVolume ?? 0),
          };
        });

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

        if (exerciseIds.length === 0) {
          setDetails([]);
          return;
        }

        // Batch query: Get all exercise details in one query
        const exerciseData = await db
          .select()
          .from(exercises)
          .where(inArray(exercises.id, exerciseIds));

        const exerciseMap = new Map(exerciseData.map(e => [e.id, e]));

        // Batch query: Get previous max weights for all exercises in one query
        const previousMaxWeights = await db
          .select({
            exerciseId: setLogs.exerciseId,
            maxWeight: sql<number>`MAX(${setLogs.weight})`,
          })
          .from(setLogs)
          .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
          .where(
            and(
              inArray(setLogs.exerciseId, exerciseIds),
              lt(workoutSessions.startedAt, session.startedAt)
            )
          )
          .groupBy(setLogs.exerciseId);

        const previousMaxMap = new Map(previousMaxWeights.map(p => [p.exerciseId, p.maxWeight]));

        // Build exercise details without additional queries
        const exerciseDetails: ExerciseDetail[] = exerciseIds.map(exerciseId => {
          const exercise = exerciseMap.get(exerciseId);
          const exerciseLogs = logs.filter(l => l.exerciseId === exerciseId);
          const maxWeight = Math.max(...exerciseLogs.map(l => l.weight));
          const previousMaxWeight = previousMaxMap.get(exerciseId) ?? 0;
          const isPR = maxWeight > previousMaxWeight;

          return {
            exerciseId,
            name: exercise?.name || 'Unknown',
            equipment: exercise?.equipment || 'unknown',
            sets: exerciseLogs.map(l => ({ reps: l.reps, weight: l.weight })),
            maxWeight,
            isPR,
          };
        });

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
    // Single aggregate query with JOIN - replaces N+1 queries
    const result = await db
      .select({
        maxWeight: sql<number>`MAX(${setLogs.weight})`,
      })
      .from(setLogs)
      .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
      .where(
        and(
          eq(setLogs.exerciseId, exerciseId),
          lt(workoutSessions.startedAt, beforeDate)
        )
      );

    return result[0]?.maxWeight ?? 0;
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
