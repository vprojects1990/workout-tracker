import { useState, useCallback, useRef, useEffect } from 'react';
import { db } from '@/db';
import { workoutSessions, setLogs, workoutTemplates } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const newSessionId = 'session-' + Date.now();
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
      id: 'set-' + Date.now() + '-' + setNumber,
      sessionId,
      exerciseId,
      setNumber,
      reps,
      weight,
      restSeconds: null,
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
