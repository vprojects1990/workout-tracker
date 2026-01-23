import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { workoutTemplates, templateExercises, exercises, workoutSessions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export type TemplateWithDetails = {
  id: string;
  name: string;
  type: string;
  exerciseCount: number;
  lastPerformed: Date | null;
};

export function useWorkoutTemplates() {
  const [templates, setTemplates] = useState<TemplateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);

      // Get all templates
      const allTemplates = await db.select().from(workoutTemplates);

      // For each template, get exercise count and last performed date
      const templatesWithDetails = await Promise.all(
        allTemplates.map(async (template) => {
          // Count exercises
          const exerciseList = await db
            .select()
            .from(templateExercises)
            .where(eq(templateExercises.templateId, template.id));

          // Get last session
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
