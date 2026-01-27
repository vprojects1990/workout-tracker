import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/db';
import { workoutSessions, setLogs, exercises } from '@/db/schema';
import { eq, isNull, inArray } from 'drizzle-orm';
import { useAppState } from '@/hooks/useAppState';

// ============================================================================
// Types
// ============================================================================

export type WeightUnit = 'kg' | 'lbs';

export type SetData = {
  id: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  completed: boolean;
  dbSynced: boolean;
};

export type ExerciseSettings = {
  restSecondsOverride: number | null;
  weightUnitOverride: WeightUnit | null;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  name: string;
  equipment: string;
  sets: SetData[];
  settings: ExerciseSettings;
};

export type ActiveWorkoutState = {
  sessionId: string;
  templateId: string | null;
  templateName: string;
  startedAt: Date;
  exercises: WorkoutExercise[];
  restEndTime: number | null;
};

type ActiveWorkoutContextType = {
  // State
  activeWorkout: ActiveWorkoutState | null;
  isLoading: boolean;
  hasActiveWorkout: boolean;

  // Computed values
  elapsedSeconds: number;
  restSeconds: number | null;

  // Actions
  startWorkout: (
    templateId: string | null,
    templateName: string,
    exercises: WorkoutExercise[]
  ) => Promise<void>;
  completeSet: (
    exerciseInstanceId: string,
    setNumber: number,
    reps: number,
    weight: number
  ) => Promise<void>;
  addSet: (exerciseInstanceId: string) => void;
  removeSet: (exerciseInstanceId: string, setNumber: number) => void;
  addExercise: (exercise: { exerciseId: string; name: string; equipment: string }) => void;
  removeExercise: (exerciseInstanceId: string) => void;
  updateExerciseSettings: (exerciseInstanceId: string, settings: Partial<ExerciseSettings>) => void;
  completeWorkout: () => Promise<void>;
  abandonWorkout: () => Promise<void>;
  dismissRestTimer: () => void;
  startRestTimer: (seconds: number) => void;
};

// ============================================================================
// Context
// ============================================================================

const ActiveWorkoutContext = createContext<ActiveWorkoutContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function ActiveWorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ref to avoid stale closures in callbacks
  const activeWorkoutRef = useRef<ActiveWorkoutState | null>(null);
  activeWorkoutRef.current = activeWorkout;

  // Handle app returning from background - recalculate timers
  const handleForeground = useCallback(() => {
    if (activeWorkout) {
      setElapsedSeconds(Math.floor((Date.now() - activeWorkout.startedAt.getTime()) / 1000));

      if (activeWorkout.restEndTime !== null) {
        const remainingMs = activeWorkout.restEndTime - Date.now();
        if (remainingMs <= 0) {
          setRestSeconds(0);
          setActiveWorkout(prev => prev ? { ...prev, restEndTime: null } : null);
        } else {
          setRestSeconds(Math.ceil(remainingMs / 1000));
        }
      }
    }
  }, [activeWorkout]);

  useAppState(handleForeground);

  // -------------------------------------------------------------------------
  // Initialize: Check for existing active workout on mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    async function checkForActiveWorkout() {
      try {
        const incompleteSession = await db
          .select()
          .from(workoutSessions)
          .where(isNull(workoutSessions.completedAt))
          .limit(1);

        if (incompleteSession.length > 0) {
          const session = incompleteSession[0];

          const completedSets = await db
            .select()
            .from(setLogs)
            .where(eq(setLogs.sessionId, session.id));

          const exerciseState = await rebuildExerciseState(completedSets);

          setActiveWorkout({
            sessionId: session.id,
            templateId: session.templateId,
            templateName: session.templateName,
            startedAt: session.startedAt,
            exercises: exerciseState,
            restEndTime: null,
          });
        }
      } catch (error) {
        console.error('Failed to check for active workout:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkForActiveWorkout();
  }, []);

  // -------------------------------------------------------------------------
  // Elapsed time timer
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!activeWorkout) {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
      return;
    }

    setElapsedSeconds(Math.floor((Date.now() - activeWorkout.startedAt.getTime()) / 1000));

    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - activeWorkout.startedAt.getTime()) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeWorkout?.sessionId]);

  // -------------------------------------------------------------------------
  // Rest timer
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!activeWorkout?.restEndTime) {
      setRestSeconds(null);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      return;
    }

    const updateRestTimer = () => {
      const remaining = Math.max(0, Math.ceil((activeWorkout.restEndTime! - Date.now()) / 1000));
      setRestSeconds(remaining);
      if (remaining === 0) {
        setActiveWorkout(prev => (prev ? { ...prev, restEndTime: null } : null));
      }
    };

    updateRestTimer();
    restTimerRef.current = setInterval(updateRestTimer, 1000);

    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [activeWorkout?.restEndTime]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const startWorkout = useCallback(
    async (
      templateId: string | null,
      templateName: string,
      exerciseList: WorkoutExercise[]
    ) => {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const startedAt = new Date();

      try {
        await db.insert(workoutSessions).values({
          id: sessionId,
          templateId,
          templateName,
          startedAt,
          completedAt: null,
          durationSeconds: null,
        });

        setActiveWorkout({
          sessionId,
          templateId,
          templateName,
          startedAt,
          exercises: exerciseList,
          restEndTime: null,
        });
      } catch (error) {
        console.error('Failed to start workout:', error);
        throw error;
      }
    },
    []
  );

  const completeSet = useCallback(
    async (exerciseInstanceId: string, setNumber: number, reps: number, weight: number) => {
      // Use ref to avoid stale closure
      const workout = activeWorkoutRef.current;
      if (!workout) return;

      const exercise = workout.exercises.find(e => e.id === exerciseInstanceId);
      if (!exercise) return;

      // Generate unique ID with random suffix to avoid collisions
      const setId = `set-${Date.now()}-${setNumber}-${Math.random().toString(36).substring(2, 9)}`;

      // Optimistic update
      setActiveWorkout(prev => {
        if (!prev) return null;
        return {
          ...prev,
          exercises: prev.exercises.map(ex =>
            ex.id === exerciseInstanceId
              ? {
                  ...ex,
                  sets: ex.sets.map(s =>
                    s.setNumber === setNumber
                      ? { ...s, id: setId, reps, weight, completed: true, dbSynced: false }
                      : s
                  ),
                }
              : ex
          ),
        };
      });

      try {
        await db.insert(setLogs).values({
          id: setId,
          sessionId: workout.sessionId,
          exerciseId: exercise.exerciseId,
          setNumber,
          reps,
          weight,
          restSeconds: null,
        });

        // Mark as synced
        setActiveWorkout(prev => {
          if (!prev) return null;
          return {
            ...prev,
            exercises: prev.exercises.map(ex =>
              ex.id === exerciseInstanceId
                ? {
                    ...ex,
                    sets: ex.sets.map(s => (s.id === setId ? { ...s, dbSynced: true } : s)),
                  }
                : ex
            ),
          };
        });
      } catch (error) {
        console.error('Failed to save set to DB:', error);
        // Rollback optimistic update on failure
        setActiveWorkout(prev => {
          if (!prev) return null;
          return {
            ...prev,
            exercises: prev.exercises.map(ex =>
              ex.id === exerciseInstanceId
                ? {
                    ...ex,
                    sets: ex.sets.map(s =>
                      s.id === setId
                        ? { ...s, reps: null, weight: null, completed: false, dbSynced: false }
                        : s
                    ),
                  }
                : ex
            ),
          };
        });
        throw error;
      }
    },
    [] // Stable callback - uses ref
  );

  const addSet = useCallback((exerciseInstanceId: string) => {
    setActiveWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.id !== exerciseInstanceId) return ex;
          const nextSetNumber = ex.sets.length + 1;
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: `pending-${Date.now()}`,
                setNumber: nextSetNumber,
                reps: null,
                weight: null,
                completed: false,
                dbSynced: false,
              },
            ],
          };
        }),
      };
    });
  }, []);

  const removeSet = useCallback((exerciseInstanceId: string, setNumber: number) => {
    setActiveWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.id !== exerciseInstanceId) return ex;
          if (ex.sets.length <= 1) return ex;
          return {
            ...ex,
            sets: ex.sets
              .filter(s => s.setNumber !== setNumber)
              .map((s, idx) => ({ ...s, setNumber: idx + 1 })),
          };
        }),
      };
    });
  }, []);

  const addExercise = useCallback(
    (exercise: { exerciseId: string; name: string; equipment: string }) => {
      setActiveWorkout(prev => {
        if (!prev) return null;
        const newExercise: WorkoutExercise = {
          ...exercise,
          id: `${exercise.exerciseId}-${Date.now()}`,
          sets: [
            {
              id: `pending-${Date.now()}`,
              setNumber: 1,
              reps: null,
              weight: null,
              completed: false,
              dbSynced: false,
            },
          ],
          settings: { restSecondsOverride: null, weightUnitOverride: null },
        };
        return {
          ...prev,
          exercises: [...prev.exercises, newExercise],
        };
      });
    },
    []
  );

  const removeExercise = useCallback((exerciseInstanceId: string) => {
    setActiveWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.filter(ex => ex.id !== exerciseInstanceId),
      };
    });
  }, []);

  const updateExerciseSettings = useCallback(
    (exerciseInstanceId: string, settings: Partial<ExerciseSettings>) => {
      setActiveWorkout(prev => {
        if (!prev) return null;
        return {
          ...prev,
          exercises: prev.exercises.map(ex =>
            ex.id === exerciseInstanceId
              ? { ...ex, settings: { ...ex.settings, ...settings } }
              : ex
          ),
        };
      });
    },
    []
  );

  const startRestTimer = useCallback((seconds: number) => {
    setActiveWorkout(prev => {
      if (!prev) return null;
      return {
        ...prev,
        restEndTime: Date.now() + seconds * 1000,
      };
    });
  }, []);

  const dismissRestTimer = useCallback(() => {
    setActiveWorkout(prev => {
      if (!prev) return null;
      return { ...prev, restEndTime: null };
    });
    setRestSeconds(null);
  }, []);

  const completeWorkout = useCallback(async () => {
    const workout = activeWorkoutRef.current;
    if (!workout) return;

    // Compute duration at call time to avoid stale elapsedSeconds
    const durationSeconds = Math.floor((Date.now() - workout.startedAt.getTime()) / 1000);

    try {
      await db
        .update(workoutSessions)
        .set({
          completedAt: new Date(),
          durationSeconds,
        })
        .where(eq(workoutSessions.id, workout.sessionId));

      setActiveWorkout(null);
    } catch (error) {
      console.error('Failed to complete workout:', error);
      throw error;
    }
  }, []);

  const abandonWorkout = useCallback(async () => {
    const workout = activeWorkoutRef.current;
    if (!workout) return;

    try {
      await db.delete(setLogs).where(eq(setLogs.sessionId, workout.sessionId));
      await db.delete(workoutSessions).where(eq(workoutSessions.id, workout.sessionId));

      setActiveWorkout(null);
    } catch (error) {
      console.error('Failed to abandon workout:', error);
      throw error;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Context Value
  // -------------------------------------------------------------------------

  const value: ActiveWorkoutContextType = {
    activeWorkout,
    isLoading,
    hasActiveWorkout: activeWorkout !== null,
    elapsedSeconds,
    restSeconds,
    startWorkout,
    completeSet,
    addSet,
    removeSet,
    addExercise,
    removeExercise,
    updateExerciseSettings,
    completeWorkout,
    abandonWorkout,
    dismissRestTimer,
    startRestTimer,
  };

  return <ActiveWorkoutContext.Provider value={value}>{children}</ActiveWorkoutContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useActiveWorkoutContext() {
  const context = useContext(ActiveWorkoutContext);
  if (context === undefined) {
    throw new Error('useActiveWorkoutContext must be used within an ActiveWorkoutProvider');
  }
  return context;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function rebuildExerciseState(
  completedSets: Array<{
    exerciseId: string;
    setNumber: number;
    reps: number;
    weight: number;
    id: string;
  }>
): Promise<WorkoutExercise[]> {
  if (completedSets.length === 0) return [];

  const setsByExercise = completedSets.reduce(
    (acc, set) => {
      if (!acc[set.exerciseId]) acc[set.exerciseId] = [];
      acc[set.exerciseId].push(set);
      return acc;
    },
    {} as Record<string, typeof completedSets>
  );

  const exerciseIds = Object.keys(setsByExercise);

  const exerciseDetails = await db
    .select()
    .from(exercises)
    .where(inArray(exercises.id, exerciseIds));

  const result: WorkoutExercise[] = [];

  for (const [exerciseId, sets] of Object.entries(setsByExercise)) {
    const exerciseInfo = exerciseDetails.find(e => e.id === exerciseId);
    if (!exerciseInfo) continue;

    // Defensive check for empty sets array
    const maxSetNumber = sets.length > 0 ? Math.max(...sets.map(s => s.setNumber)) : 0;
    const setsArray: SetData[] = [];

    for (let i = 1; i <= maxSetNumber; i++) {
      const completedSet = sets.find(s => s.setNumber === i);
      setsArray.push({
        id: completedSet?.id || `pending-${Date.now()}-${i}`,
        setNumber: i,
        reps: completedSet?.reps ?? null,
        weight: completedSet?.weight ?? null,
        completed: !!completedSet,
        dbSynced: !!completedSet,
      });
    }

    // Add one empty set for the next entry
    setsArray.push({
      id: `pending-${Date.now()}-next`,
      setNumber: maxSetNumber + 1,
      reps: null,
      weight: null,
      completed: false,
      dbSynced: false,
    });

    result.push({
      id: `${exerciseId}-restored-${Date.now()}`,
      exerciseId,
      name: exerciseInfo.name,
      equipment: exerciseInfo.equipment,
      sets: setsArray,
      settings: { restSecondsOverride: null, weightUnitOverride: null },
    });
  }

  return result;
}
