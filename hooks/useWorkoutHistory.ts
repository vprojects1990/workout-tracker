import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { workoutSessions, setLogs } from '@/db/schema';
import { eq, desc, isNotNull } from 'drizzle-orm';

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
