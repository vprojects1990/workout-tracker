import type { WeightUnit } from '@/hooks/useSettings';

// Base set data used in UI components (SetInput, etc.)
export type SetData = {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  completed: boolean;
};

// Extended set data used in ActiveWorkoutContext with DB sync tracking
export type ActiveSetData = SetData & {
  id: string;
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
  sets: ActiveSetData[];
  settings: ExerciseSettings;
};

export type WorkoutHistoryItem = {
  id: string;
  templateName: string;
  completedAt: Date;
  durationSeconds: number;
  exerciseCount: number;
  totalSets: number;
  totalVolume: number;
};

export type ExerciseDetail = {
  exerciseId: string;
  name: string;
  equipment: string;
  sets: Array<{ reps: number; weight: number }>;
  maxWeight: number;
  isPR: boolean;
};
