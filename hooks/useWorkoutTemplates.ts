import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { workoutTemplates, templateExercises, exercises, workoutSessions, workoutSplits } from '@/db/schema';
import { eq, desc, isNull, inArray } from 'drizzle-orm';

export type TemplateWithDetails = {
  id: string;
  name: string;
  type: string;
  exerciseCount: number;
  lastPerformed: Date | null;
  orderIndex: number;
  dayOfWeek: number | null;
};

export type SplitWithTemplates = {
  id: string;
  name: string;
  description: string | null;
  templates: TemplateWithDetails[];
};

export function useWorkoutSplits() {
  const [splits, setSplits] = useState<SplitWithTemplates[]>([]);
  const [standaloneTemplates, setStandaloneTemplates] = useState<TemplateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSplits = useCallback(async () => {
    try {
      setLoading(true);

      // Get all splits
      const allSplits = await db.select().from(workoutSplits);

      // Get all templates
      const allTemplates = await db.select().from(workoutTemplates);

      // For each template, get exercise count and last performed date
      const templatesWithDetails = await Promise.all(
        allTemplates.map(async (template) => {
          const exerciseList = await db
            .select()
            .from(templateExercises)
            .where(eq(templateExercises.templateId, template.id));

          const lastSession = await db
            .select()
            .from(workoutSessions)
            .where(eq(workoutSessions.templateId, template.id))
            .orderBy(desc(workoutSessions.completedAt))
            .limit(1);

          return {
            id: template.id,
            splitId: template.splitId,
            name: template.name,
            type: template.type,
            orderIndex: template.orderIndex,
            dayOfWeek: template.dayOfWeek,
            exerciseCount: exerciseList.length,
            lastPerformed: lastSession[0]?.completedAt || null,
          };
        })
      );

      // Group templates by split
      const splitsWithTemplates = allSplits.map(split => ({
        id: split.id,
        name: split.name,
        description: split.description,
        templates: templatesWithDetails
          .filter(t => t.splitId === split.id)
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map(({ splitId, ...rest }) => rest),
      }));

      // Get standalone templates (no split)
      const standalone = templatesWithDetails
        .filter(t => !t.splitId)
        .map(({ splitId, ...rest }) => rest);

      setSplits(splitsWithTemplates);
      setStandaloneTemplates(standalone);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch splits'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSplits();
  }, [fetchSplits]);

  return { splits, standaloneTemplates, loading, error, refetch: fetchSplits };
}

// Keep the old hook for backwards compatibility
export function useWorkoutTemplates() {
  const [templates, setTemplates] = useState<TemplateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);

      const allTemplates = await db.select().from(workoutTemplates);

      const templatesWithDetails = await Promise.all(
        allTemplates.map(async (template) => {
          const exerciseList = await db
            .select()
            .from(templateExercises)
            .where(eq(templateExercises.templateId, template.id));

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
            orderIndex: template.orderIndex,
            dayOfWeek: template.dayOfWeek,
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

    const currentTemplateId = templateId;

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
          .where(eq(templateExercises.templateId, currentTemplateId))
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

// Hook to get all exercises for exercise picker
export function useAllExercises() {
  const [exerciseList, setExerciseList] = useState<Array<{
    id: string;
    name: string;
    equipment: string;
    primaryMuscle: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchExercises() {
      try {
        setLoading(true);
        const result = await db
          .select({
            id: exercises.id,
            name: exercises.name,
            equipment: exercises.equipment,
            primaryMuscle: exercises.primaryMuscle,
          })
          .from(exercises)
          .orderBy(exercises.primaryMuscle, exercises.name);

        setExerciseList(result);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to fetch exercises'));
      } finally {
        setLoading(false);
      }
    }

    fetchExercises();
  }, []);

  return { exercises: exerciseList, loading, error };
}

// Hook for database mutations (create, update, delete)
export function useWorkoutMutations() {
  // Create a new workout split
  async function createWorkoutSplit(name: string, description?: string): Promise<string> {
    const id = 'split-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    await db.insert(workoutSplits).values({
      id,
      name,
      description: description ?? null,
      createdAt: new Date(),
    });
    return id;
  }

  // Create a template within a split
  async function createWorkoutTemplate(
    splitId: string,
    name: string,
    type: string,
    orderIndex: number,
    dayOfWeek?: number
  ): Promise<string> {
    const id = 'template-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    await db.insert(workoutTemplates).values({
      id,
      splitId,
      name,
      type,
      orderIndex,
      dayOfWeek: dayOfWeek ?? null,
      createdAt: new Date(),
    });
    return id;
  }

  // Add exercise to template with rep/set targets
  async function addTemplateExercise(
    templateId: string,
    exerciseId: string,
    orderIndex: number,
    targetSets: number,
    targetRepMin: number,
    targetRepMax: number
  ): Promise<void> {
    const id = 'texercise-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    await db.insert(templateExercises).values({
      id,
      templateId,
      exerciseId,
      orderIndex,
      targetSets,
      targetRepMin,
      targetRepMax,
    });
  }

  // Delete a split and its templates (cascading delete)
  async function deleteWorkoutSplit(splitId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // First, get all templates belonging to this split
      const templatesInSplit = await tx
        .select({ id: workoutTemplates.id })
        .from(workoutTemplates)
        .where(eq(workoutTemplates.splitId, splitId));

      const templateIds = templatesInSplit.map(t => t.id);

      // Delete all template exercises for these templates
      if (templateIds.length > 0) {
        await tx
          .delete(templateExercises)
          .where(inArray(templateExercises.templateId, templateIds));
      }

      // Delete all templates belonging to the split
      await tx
        .delete(workoutTemplates)
        .where(eq(workoutTemplates.splitId, splitId));

      // Finally, delete the split itself
      await tx
        .delete(workoutSplits)
        .where(eq(workoutSplits.id, splitId));
    });
  }

  // Delete a single workout template
  async function deleteWorkoutTemplate(templateId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete all template exercises for this template
      await tx
        .delete(templateExercises)
        .where(eq(templateExercises.templateId, templateId));

      // Delete the template itself
      await tx
        .delete(workoutTemplates)
        .where(eq(workoutTemplates.id, templateId));
    });
  }

  // Create a full split with workout days and exercises in a single transaction
  type WorkoutDayInput = {
    id: string;
    dayOfWeek: number;
    suffix: string;
    displayName: string;
  };

  type ExerciseInput = {
    exerciseId: string;
    targetSets: number;
    targetRepMin: number;
    targetRepMax: number;
  };

  async function createFullSplit(
    splitName: string,
    splitDescription: string | undefined,
    workoutDays: WorkoutDayInput[],
    dayExercises: Map<string, ExerciseInput[]>
  ): Promise<string> {
    const splitId = 'split-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    await db.transaction(async (tx) => {
      // Create the split
      await tx.insert(workoutSplits).values({
        id: splitId,
        name: splitName,
        description: splitDescription ?? null,
        createdAt: new Date(),
      });

      // Create templates for each workout day
      for (let i = 0; i < workoutDays.length; i++) {
        const day = workoutDays[i];
        const templateId = 'template-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + i;

        await tx.insert(workoutTemplates).values({
          id: templateId,
          splitId,
          name: day.displayName,
          type: 'custom',
          orderIndex: i,
          dayOfWeek: day.dayOfWeek,
          createdAt: new Date(),
        });

        // Add exercises for this template
        const exercisesForDay = dayExercises.get(day.id) || [];
        for (let j = 0; j < exercisesForDay.length; j++) {
          const exercise = exercisesForDay[j];
          const exerciseTemplateId = 'texercise-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + i + '-' + j;

          await tx.insert(templateExercises).values({
            id: exerciseTemplateId,
            templateId,
            exerciseId: exercise.exerciseId,
            orderIndex: j,
            targetSets: exercise.targetSets,
            targetRepMin: exercise.targetRepMin,
            targetRepMax: exercise.targetRepMax,
          });
        }
      }
    });

    return splitId;
  }

  return {
    createWorkoutSplit,
    createWorkoutTemplate,
    addTemplateExercise,
    deleteWorkoutSplit,
    deleteWorkoutTemplate,
    createFullSplit,
  };
}
