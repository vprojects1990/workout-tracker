import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { workoutSessions, setLogs } from '@/db/schema';
import { eq, desc, isNotNull } from 'drizzle-orm';
import type { WorkoutHistoryItem, ExerciseDetail } from '@/types';
import { fetchSessionSetStats, fetchExercisesByIds, fetchPreviousMaxWeights } from '@/db/queries';

export type { WorkoutHistoryItem, ExerciseDetail } from '@/types';

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

      // Batch query: Get aggregated set data for all sessions
      const sessionIds = sessions.map(s => s.id);
      const statsMap = fetchSessionSetStats(sessionIds);

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

        // Batch query: Get all exercise details
        const exerciseData = fetchExercisesByIds(exerciseIds);
        const exerciseMap = new Map(exerciseData.map(e => [e.id, e]));

        // Batch query: Get previous max weights for PR detection
        const previousMaxMap = fetchPreviousMaxWeights(exerciseIds, session.startedAt);

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
