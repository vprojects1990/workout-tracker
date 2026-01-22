import { db } from './index';
import { exercises, workoutTemplates, templateExercises } from './schema';
import { eq } from 'drizzle-orm';

const EXERCISE_DATA = [
  // Chest
  { id: 'bench-press-barbell', name: 'Bench Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'barbell', isCustom: false },
  { id: 'incline-bench-press-barbell', name: 'Incline Bench Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'barbell', isCustom: false },
  { id: 'bench-press-dumbbell', name: 'Dumbbell Bench Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'dumbbell', isCustom: false },
  { id: 'incline-bench-press-dumbbell', name: 'Incline Dumbbell Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'dumbbell', isCustom: false },
  { id: 'chest-fly-dumbbell', name: 'Dumbbell Fly', primaryMuscle: 'chest', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'cable-crossover', name: 'Cable Crossover', primaryMuscle: 'chest', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'chest-press-machine', name: 'Chest Press Machine', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'machine', isCustom: false },
  { id: 'push-up', name: 'Push Up', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'bodyweight', isCustom: false },

  // Back
  { id: 'barbell-row', name: 'Barbell Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'barbell', isCustom: false },
  { id: 'dumbbell-row', name: 'Dumbbell Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'lat-pulldown', name: 'Lat Pulldown', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'cable', isCustom: false },
  { id: 'seated-cable-row', name: 'Seated Cable Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'cable', isCustom: false },
  { id: 'pull-up', name: 'Pull Up', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'bodyweight', isCustom: false },
  { id: 'chin-up', name: 'Chin Up', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'bodyweight', isCustom: false },
  { id: 'deadlift', name: 'Deadlift', primaryMuscle: 'back', secondaryMuscles: '["hamstrings","glutes"]', equipment: 'barbell', isCustom: false },
  { id: 't-bar-row', name: 'T-Bar Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'barbell', isCustom: false },

  // Shoulders
  { id: 'overhead-press-barbell', name: 'Overhead Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'barbell', isCustom: false },
  { id: 'overhead-press-dumbbell', name: 'Dumbbell Shoulder Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'lateral-raise', name: 'Lateral Raise', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'front-raise', name: 'Front Raise', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'face-pull', name: 'Face Pull', primaryMuscle: 'shoulders', secondaryMuscles: '["back"]', equipment: 'cable', isCustom: false },
  { id: 'arnold-press', name: 'Arnold Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'dumbbell', isCustom: false },

  // Biceps
  { id: 'barbell-curl', name: 'Barbell Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'hammer-curl', name: 'Hammer Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'preacher-curl', name: 'Preacher Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'cable-curl', name: 'Cable Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },

  // Triceps
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'skull-crusher', name: 'Skull Crusher', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'overhead-tricep-extension', name: 'Overhead Tricep Extension', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'close-grip-bench-press', name: 'Close Grip Bench Press', primaryMuscle: 'triceps', secondaryMuscles: '["chest"]', equipment: 'barbell', isCustom: false },
  { id: 'tricep-dip', name: 'Tricep Dip', primaryMuscle: 'triceps', secondaryMuscles: '["chest","shoulders"]', equipment: 'bodyweight', isCustom: false },
  { id: 'tricep-kickback', name: 'Tricep Kickback', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },

  // Quads
  { id: 'squat-barbell', name: 'Barbell Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'barbell', isCustom: false },
  { id: 'front-squat', name: 'Front Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'barbell', isCustom: false },
  { id: 'leg-press', name: 'Leg Press', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'machine', isCustom: false },
  { id: 'leg-extension', name: 'Leg Extension', primaryMuscle: 'quads', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
  { id: 'goblet-squat', name: 'Goblet Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'dumbbell', isCustom: false },
  { id: 'lunge-dumbbell', name: 'Dumbbell Lunge', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'dumbbell', isCustom: false },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'dumbbell', isCustom: false },
  { id: 'hack-squat', name: 'Hack Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'machine', isCustom: false },

  // Hamstrings
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: '["glutes","back"]', equipment: 'barbell', isCustom: false },
  { id: 'leg-curl-lying', name: 'Lying Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
  { id: 'leg-curl-seated', name: 'Seated Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
  { id: 'good-morning', name: 'Good Morning', primaryMuscle: 'hamstrings', secondaryMuscles: '["back","glutes"]', equipment: 'barbell', isCustom: false },
  { id: 'stiff-leg-deadlift', name: 'Stiff Leg Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: '["glutes","back"]', equipment: 'barbell', isCustom: false },

  // Glutes
  { id: 'hip-thrust', name: 'Hip Thrust', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings"]', equipment: 'barbell', isCustom: false },
  { id: 'glute-bridge', name: 'Glute Bridge', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings"]', equipment: 'bodyweight', isCustom: false },
  { id: 'cable-kickback', name: 'Cable Kickback', primaryMuscle: 'glutes', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings","back"]', equipment: 'barbell', isCustom: false },

  // Core
  { id: 'plank', name: 'Plank', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },
  { id: 'crunch', name: 'Crunch', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },
  { id: 'leg-raise', name: 'Leg Raise', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },
  { id: 'cable-crunch', name: 'Cable Crunch', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'russian-twist', name: 'Russian Twist', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },

  // Calves
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
];

export async function seedExercises() {
  // Check if exercises already exist
  const existingExercises = await db.select().from(exercises).limit(1);
  if (existingExercises.length > 0) {
    return; // Already seeded
  }

  // Insert all exercises
  for (const exercise of EXERCISE_DATA) {
    await db.insert(exercises).values(exercise);
  }
}

export async function seedDefaultTemplates() {
  // Check if templates already exist
  const existingTemplates = await db.select().from(workoutTemplates).limit(1);
  if (existingTemplates.length > 0) {
    return; // Already seeded
  }

  const now = new Date();

  // Upper A template
  await db.insert(workoutTemplates).values({
    id: 'upper-a',
    name: 'Upper A',
    type: 'upper',
    createdAt: now,
  });

  const upperAExercises = [
    { exerciseId: 'bench-press-barbell', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'barbell-row', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'overhead-press-dumbbell', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'lat-pulldown', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'dumbbell-curl', repMin: 10, repMax: 15, sets: 2 },
    { exerciseId: 'tricep-pushdown', repMin: 10, repMax: 15, sets: 2 },
  ];

  for (let i = 0; i < upperAExercises.length; i++) {
    const ex = upperAExercises[i];
    await db.insert(templateExercises).values({
      id: `upper-a-ex-${i}`,
      templateId: 'upper-a',
      exerciseId: ex.exerciseId,
      orderIndex: i,
      targetRepMin: ex.repMin,
      targetRepMax: ex.repMax,
      targetSets: ex.sets,
    });
  }

  // Upper B template
  await db.insert(workoutTemplates).values({
    id: 'upper-b',
    name: 'Upper B',
    type: 'upper',
    createdAt: now,
  });

  const upperBExercises = [
    { exerciseId: 'incline-bench-press-dumbbell', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'seated-cable-row', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'overhead-press-barbell', repMin: 6, repMax: 10, sets: 3 },
    { exerciseId: 'dumbbell-row', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'hammer-curl', repMin: 10, repMax: 15, sets: 2 },
    { exerciseId: 'skull-crusher', repMin: 10, repMax: 15, sets: 2 },
  ];

  for (let i = 0; i < upperBExercises.length; i++) {
    const ex = upperBExercises[i];
    await db.insert(templateExercises).values({
      id: `upper-b-ex-${i}`,
      templateId: 'upper-b',
      exerciseId: ex.exerciseId,
      orderIndex: i,
      targetRepMin: ex.repMin,
      targetRepMax: ex.repMax,
      targetSets: ex.sets,
    });
  }

  // Lower A template
  await db.insert(workoutTemplates).values({
    id: 'lower-a',
    name: 'Lower A',
    type: 'lower',
    createdAt: now,
  });

  const lowerAExercises = [
    { exerciseId: 'squat-barbell', repMin: 6, repMax: 10, sets: 4 },
    { exerciseId: 'romanian-deadlift', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'leg-press', repMin: 10, repMax: 15, sets: 3 },
    { exerciseId: 'leg-curl-lying', repMin: 10, repMax: 15, sets: 3 },
    { exerciseId: 'standing-calf-raise', repMin: 12, repMax: 20, sets: 3 },
  ];

  for (let i = 0; i < lowerAExercises.length; i++) {
    const ex = lowerAExercises[i];
    await db.insert(templateExercises).values({
      id: `lower-a-ex-${i}`,
      templateId: 'lower-a',
      exerciseId: ex.exerciseId,
      orderIndex: i,
      targetRepMin: ex.repMin,
      targetRepMax: ex.repMax,
      targetSets: ex.sets,
    });
  }

  // Lower B template
  await db.insert(workoutTemplates).values({
    id: 'lower-b',
    name: 'Lower B',
    type: 'lower',
    createdAt: now,
  });

  const lowerBExercises = [
    { exerciseId: 'deadlift', repMin: 5, repMax: 8, sets: 4 },
    { exerciseId: 'bulgarian-split-squat', repMin: 8, repMax: 12, sets: 3 },
    { exerciseId: 'leg-extension', repMin: 10, repMax: 15, sets: 3 },
    { exerciseId: 'leg-curl-seated', repMin: 10, repMax: 15, sets: 3 },
    { exerciseId: 'seated-calf-raise', repMin: 12, repMax: 20, sets: 3 },
  ];

  for (let i = 0; i < lowerBExercises.length; i++) {
    const ex = lowerBExercises[i];
    await db.insert(templateExercises).values({
      id: `lower-b-ex-${i}`,
      templateId: 'lower-b',
      exerciseId: ex.exerciseId,
      orderIndex: i,
      targetRepMin: ex.repMin,
      targetRepMax: ex.repMax,
      targetSets: ex.sets,
    });
  }
}

export async function seedDatabase() {
  await seedExercises();
  await seedDefaultTemplates();
}
