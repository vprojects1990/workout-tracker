import { db } from './index';
import { exercises, workoutTemplates, templateExercises, workoutSplits } from './schema';
import { eq } from 'drizzle-orm';

const EXERCISE_DATA = [
  // Chest - Barbell
  { id: 'bench-press-barbell', name: 'Bench Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'barbell', isCustom: false },
  { id: 'incline-bench-press-barbell', name: 'Incline Bench Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'barbell', isCustom: false },
  { id: 'decline-bench-press-barbell', name: 'Decline Bench Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'barbell', isCustom: false },
  { id: 'close-grip-bench-press-chest', name: 'Close Grip Bench Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps"]', equipment: 'barbell', isCustom: false },
  { id: 'wide-grip-bench-press-barbell', name: 'Wide Grip Bench Press', primaryMuscle: 'chest', secondaryMuscles: '["shoulders"]', equipment: 'barbell', isCustom: false },
  { id: 'pullover-barbell', name: 'Barbell Pullover', primaryMuscle: 'chest', secondaryMuscles: '["back","triceps"]', equipment: 'barbell', isCustom: false },
  // Chest - Dumbbell
  { id: 'bench-press-dumbbell', name: 'Dumbbell Bench Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'dumbbell', isCustom: false },
  { id: 'incline-bench-press-dumbbell', name: 'Incline Dumbbell Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'dumbbell', isCustom: false },
  { id: 'decline-press-dumbbell', name: 'Decline Dumbbell Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'dumbbell', isCustom: false },
  { id: 'chest-fly-dumbbell', name: 'Dumbbell Fly', primaryMuscle: 'chest', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'incline-fly-dumbbell', name: 'Incline Dumbbell Fly', primaryMuscle: 'chest', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'decline-fly-dumbbell', name: 'Decline Dumbbell Fly', primaryMuscle: 'chest', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'pullover-dumbbell', name: 'Dumbbell Pullover', primaryMuscle: 'chest', secondaryMuscles: '["back","triceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'squeeze-press-dumbbell', name: 'Squeeze Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps"]', equipment: 'dumbbell', isCustom: false },
  // Chest - Cable
  { id: 'cable-crossover', name: 'Cable Crossover', primaryMuscle: 'chest', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'chest-press-cable', name: 'Cable Chest Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'cable', isCustom: false },
  { id: 'incline-chest-press-cable', name: 'Incline Cable Chest Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'cable', isCustom: false },
  { id: 'decline-chest-press-cable', name: 'Decline Cable Chest Press', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'cable', isCustom: false },
  { id: 'low-cable-fly', name: 'Low to High Cable Fly', primaryMuscle: 'chest', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'high-cable-fly', name: 'High to Low Cable Fly', primaryMuscle: 'chest', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'pullover-cable', name: 'Cable Pullover', primaryMuscle: 'chest', secondaryMuscles: '["back","triceps"]', equipment: 'cable', isCustom: false },
  // Chest - Machine & Bodyweight
  { id: 'chest-press-machine', name: 'Chest Press Machine', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'machine', isCustom: false },
  { id: 'push-up', name: 'Push Up', primaryMuscle: 'chest', secondaryMuscles: '["triceps","shoulders"]', equipment: 'bodyweight', isCustom: false },

  // Back - Barbell
  { id: 'barbell-row', name: 'Barbell Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'barbell', isCustom: false },
  { id: 'pendlay-row-barbell', name: 'Pendlay Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'barbell', isCustom: false },
  { id: 't-bar-row', name: 'T-Bar Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'barbell', isCustom: false },
  { id: 'underhand-row-barbell', name: 'Underhand Barbell Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'barbell', isCustom: false },
  { id: 'deadlift', name: 'Deadlift', primaryMuscle: 'back', secondaryMuscles: '["hamstrings","glutes"]', equipment: 'barbell', isCustom: false },
  { id: 'romanian-deadlift-back', name: 'Romanian Deadlift', primaryMuscle: 'back', secondaryMuscles: '["hamstrings","glutes"]', equipment: 'barbell', isCustom: false },
  { id: 'good-morning-back', name: 'Good Morning', primaryMuscle: 'back', secondaryMuscles: '["hamstrings","glutes"]', equipment: 'barbell', isCustom: false },
  { id: 'shrug-barbell', name: 'Barbell Shrug', primaryMuscle: 'back', secondaryMuscles: '["shoulders"]', equipment: 'barbell', isCustom: false },
  { id: 'rack-pull-barbell', name: 'Rack Pull', primaryMuscle: 'back', secondaryMuscles: '["hamstrings","glutes"]', equipment: 'barbell', isCustom: false },
  // Back - Dumbbell
  { id: 'dumbbell-row', name: 'Dumbbell Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'one-arm-row-dumbbell', name: 'One Arm Dumbbell Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'incline-row-dumbbell', name: 'Incline Dumbbell Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'pullover-back-dumbbell', name: 'Dumbbell Pullover', primaryMuscle: 'back', secondaryMuscles: '["chest","triceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'romanian-deadlift-dumbbell', name: 'Dumbbell Romanian Deadlift', primaryMuscle: 'back', secondaryMuscles: '["hamstrings","glutes"]', equipment: 'dumbbell', isCustom: false },
  { id: 'shrug-dumbbell', name: 'Dumbbell Shrug', primaryMuscle: 'back', secondaryMuscles: '["shoulders"]', equipment: 'dumbbell', isCustom: false },
  // Back - Cable
  { id: 'lat-pulldown', name: 'Lat Pulldown', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'cable', isCustom: false },
  { id: 'wide-grip-pulldown-cable', name: 'Wide Grip Pulldown', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'cable', isCustom: false },
  { id: 'close-grip-pulldown-cable', name: 'Close Grip Pulldown', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'cable', isCustom: false },
  { id: 'straight-arm-pulldown-cable', name: 'Straight Arm Pulldown', primaryMuscle: 'back', secondaryMuscles: '["triceps"]', equipment: 'cable', isCustom: false },
  { id: 'seated-cable-row', name: 'Seated Cable Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'cable', isCustom: false },
  { id: 'one-arm-cable-row', name: 'One Arm Cable Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'cable', isCustom: false },
  { id: 'wide-grip-cable-row', name: 'Wide Grip Cable Row', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'cable', isCustom: false },
  { id: 'face-pull-back', name: 'Face Pull', primaryMuscle: 'back', secondaryMuscles: '["shoulders"]', equipment: 'cable', isCustom: false },
  { id: 'pullover-back-cable', name: 'Cable Pullover', primaryMuscle: 'back', secondaryMuscles: '["chest","triceps"]', equipment: 'cable', isCustom: false },
  { id: 'shrug-cable', name: 'Cable Shrug', primaryMuscle: 'back', secondaryMuscles: '["shoulders"]', equipment: 'cable', isCustom: false },
  // Back - Bodyweight
  { id: 'pull-up', name: 'Pull Up', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'bodyweight', isCustom: false },
  { id: 'chin-up', name: 'Chin Up', primaryMuscle: 'back', secondaryMuscles: '["biceps"]', equipment: 'bodyweight', isCustom: false },

  // Shoulders - Barbell
  { id: 'overhead-press-barbell', name: 'Overhead Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'barbell', isCustom: false },
  { id: 'military-press-barbell', name: 'Military Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'barbell', isCustom: false },
  { id: 'seated-military-press-barbell', name: 'Seated Military Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'barbell', isCustom: false },
  { id: 'behind-neck-press-barbell', name: 'Behind Neck Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'barbell', isCustom: false },
  { id: 'front-raise-barbell', name: 'Barbell Front Raise', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'upright-row-barbell', name: 'Barbell Upright Row', primaryMuscle: 'shoulders', secondaryMuscles: '["biceps"]', equipment: 'barbell', isCustom: false },
  { id: 'wide-upright-row-barbell', name: 'Wide Grip Upright Row', primaryMuscle: 'shoulders', secondaryMuscles: '["biceps"]', equipment: 'barbell', isCustom: false },
  { id: 'rear-delt-row-barbell', name: 'Barbell Rear Delt Row', primaryMuscle: 'shoulders', secondaryMuscles: '["back"]', equipment: 'barbell', isCustom: false },
  // Shoulders - Dumbbell
  { id: 'overhead-press-dumbbell', name: 'Dumbbell Shoulder Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'arnold-press', name: 'Arnold Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'one-arm-shoulder-press-dumbbell', name: 'One Arm Shoulder Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'front-raise', name: 'Front Raise', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'alternating-front-raise-dumbbell', name: 'Alternating Front Raise', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'lateral-raise', name: 'Lateral Raise', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'incline-lateral-raise-dumbbell', name: 'Incline Lateral Raise', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'lying-lateral-raise-dumbbell', name: 'Lying Lateral Raise', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'bent-over-lateral-raise-dumbbell', name: 'Bent Over Lateral Raise', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'upright-row-dumbbell', name: 'Dumbbell Upright Row', primaryMuscle: 'shoulders', secondaryMuscles: '["biceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'shrug-shoulder-dumbbell', name: 'Dumbbell Shrug', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  // Shoulders - Cable
  { id: 'shoulder-press-cable', name: 'Cable Shoulder Press', primaryMuscle: 'shoulders', secondaryMuscles: '["triceps"]', equipment: 'cable', isCustom: false },
  { id: 'front-raise-cable', name: 'Cable Front Raise', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'lateral-raise-cable', name: 'Cable Lateral Raise', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'rear-delt-pull-cable', name: 'Cable Rear Delt Pull', primaryMuscle: 'shoulders', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'face-pull', name: 'Face Pull', primaryMuscle: 'shoulders', secondaryMuscles: '["back"]', equipment: 'cable', isCustom: false },
  { id: 'upright-row-cable', name: 'Cable Upright Row', primaryMuscle: 'shoulders', secondaryMuscles: '["biceps"]', equipment: 'cable', isCustom: false },

  // Biceps - Barbell
  { id: 'barbell-curl', name: 'Barbell Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'ez-bar-curl', name: 'EZ Bar Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'preacher-curl', name: 'Preacher Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'ez-bar-preacher-curl', name: 'EZ Bar Preacher Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'reverse-curl-barbell', name: 'Barbell Reverse Curl', primaryMuscle: 'biceps', secondaryMuscles: '["forearms"]', equipment: 'barbell', isCustom: false },
  // Biceps - Dumbbell
  { id: 'dumbbell-curl', name: 'Dumbbell Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'alternating-curl-dumbbell', name: 'Alternating Dumbbell Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'preacher-curl-dumbbell', name: 'Dumbbell Preacher Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'one-arm-preacher-curl-dumbbell', name: 'One Arm Preacher Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'concentration-curl-dumbbell', name: 'Concentration Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'hammer-curl', name: 'Hammer Curl', primaryMuscle: 'biceps', secondaryMuscles: '["forearms"]', equipment: 'dumbbell', isCustom: false },
  { id: 'incline-hammer-curl-dumbbell', name: 'Incline Hammer Curl', primaryMuscle: 'biceps', secondaryMuscles: '["forearms"]', equipment: 'dumbbell', isCustom: false },
  { id: 'reverse-curl-dumbbell', name: 'Dumbbell Reverse Curl', primaryMuscle: 'biceps', secondaryMuscles: '["forearms"]', equipment: 'dumbbell', isCustom: false },
  // Biceps - Cable
  { id: 'cable-curl', name: 'Cable Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'one-arm-cable-curl', name: 'One Arm Cable Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'preacher-curl-cable', name: 'Cable Preacher Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'concentration-curl-cable', name: 'Cable Concentration Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'hammer-curl-cable', name: 'Cable Hammer Curl', primaryMuscle: 'biceps', secondaryMuscles: '["forearms"]', equipment: 'cable', isCustom: false },
  { id: 'high-cable-curl', name: 'High Cable Curl', primaryMuscle: 'biceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },

  // Triceps - Barbell
  { id: 'skull-crusher', name: 'Skull Crusher', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'overhead-extension-barbell', name: 'Barbell Overhead Extension', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'close-grip-bench-press', name: 'Close Grip Bench Press', primaryMuscle: 'triceps', secondaryMuscles: '["chest"]', equipment: 'barbell', isCustom: false },
  { id: 'jm-press-barbell', name: 'JM Press', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  // Triceps - Dumbbell
  { id: 'overhead-tricep-extension', name: 'Overhead Tricep Extension', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'one-arm-extension-dumbbell', name: 'One Arm Tricep Extension', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'lying-tricep-extension-dumbbell', name: 'Lying Dumbbell Tricep Extension', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'tricep-kickback', name: 'Tricep Kickback', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'close-grip-press-dumbbell', name: 'Dumbbell Close Grip Press', primaryMuscle: 'triceps', secondaryMuscles: '["chest"]', equipment: 'dumbbell', isCustom: false },
  { id: 'seated-tricep-extension-dumbbell', name: 'Seated Dumbbell Tricep Extension', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  // Triceps - Cable
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'rope-pushdown-cable', name: 'Rope Pushdown', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'one-arm-pushdown-cable', name: 'One Arm Pushdown', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'reverse-grip-pushdown-cable', name: 'Reverse Grip Pushdown', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'overhead-extension-cable', name: 'Cable Overhead Tricep Extension', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'tricep-kickback-cable', name: 'Cable Tricep Kickback', primaryMuscle: 'triceps', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  // Triceps - Bodyweight
  { id: 'tricep-dip', name: 'Tricep Dip', primaryMuscle: 'triceps', secondaryMuscles: '["chest","shoulders"]', equipment: 'bodyweight', isCustom: false },
  { id: 'bench-dip', name: 'Bench Dip', primaryMuscle: 'triceps', secondaryMuscles: '["chest","shoulders"]', equipment: 'bodyweight', isCustom: false },

  // Forearms - Barbell
  { id: 'wrist-curl-barbell', name: 'Barbell Wrist Curl', primaryMuscle: 'forearms', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'reverse-wrist-curl-barbell', name: 'Barbell Reverse Wrist Curl', primaryMuscle: 'forearms', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'reverse-curl-forearms-barbell', name: 'Barbell Reverse Curl', primaryMuscle: 'forearms', secondaryMuscles: '["biceps"]', equipment: 'barbell', isCustom: false },
  // Forearms - Dumbbell
  { id: 'wrist-curl-dumbbell', name: 'Dumbbell Wrist Curl', primaryMuscle: 'forearms', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'reverse-wrist-curl-dumbbell', name: 'Dumbbell Reverse Wrist Curl', primaryMuscle: 'forearms', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'reverse-curl-forearms-dumbbell', name: 'Dumbbell Reverse Curl', primaryMuscle: 'forearms', secondaryMuscles: '["biceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'hammer-curl-forearms', name: 'Hammer Curl', primaryMuscle: 'forearms', secondaryMuscles: '["biceps"]', equipment: 'dumbbell', isCustom: false },
  { id: 'pronation-dumbbell', name: 'Seated Pronation', primaryMuscle: 'forearms', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'supination-dumbbell', name: 'Seated Supination', primaryMuscle: 'forearms', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  // Forearms - Cable
  { id: 'wrist-curl-cable', name: 'Cable Wrist Curl', primaryMuscle: 'forearms', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'reverse-wrist-curl-cable', name: 'Cable Reverse Wrist Curl', primaryMuscle: 'forearms', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'reverse-curl-forearms-cable', name: 'Cable Reverse Curl', primaryMuscle: 'forearms', secondaryMuscles: '["biceps"]', equipment: 'cable', isCustom: false },

  // Quads - Barbell
  { id: 'squat-barbell', name: 'Barbell Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'barbell', isCustom: false },
  { id: 'front-squat', name: 'Front Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'barbell', isCustom: false },
  { id: 'hack-squat-barbell', name: 'Barbell Hack Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'barbell', isCustom: false },
  { id: 'lunge-barbell', name: 'Barbell Lunge', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'barbell', isCustom: false },
  { id: 'reverse-lunge-barbell', name: 'Barbell Reverse Lunge', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'barbell', isCustom: false },
  { id: 'walking-lunge-barbell', name: 'Barbell Walking Lunge', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'barbell', isCustom: false },
  { id: 'step-up-barbell', name: 'Barbell Step Up', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'barbell', isCustom: false },
  { id: 'split-squat-barbell', name: 'Barbell Split Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'barbell', isCustom: false },
  { id: 'bulgarian-split-squat-barbell', name: 'Barbell Bulgarian Split Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'barbell', isCustom: false },
  // Quads - Dumbbell
  { id: 'goblet-squat', name: 'Goblet Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'dumbbell', isCustom: false },
  { id: 'squat-dumbbell', name: 'Dumbbell Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'dumbbell', isCustom: false },
  { id: 'lunge-dumbbell', name: 'Dumbbell Lunge', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'dumbbell', isCustom: false },
  { id: 'reverse-lunge-dumbbell', name: 'Dumbbell Reverse Lunge', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'dumbbell', isCustom: false },
  { id: 'walking-lunge-dumbbell', name: 'Dumbbell Walking Lunge', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'dumbbell', isCustom: false },
  { id: 'step-up-dumbbell', name: 'Dumbbell Step Up', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'dumbbell', isCustom: false },
  { id: 'split-squat-dumbbell', name: 'Dumbbell Split Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'dumbbell', isCustom: false },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'dumbbell', isCustom: false },
  // Quads - Cable
  { id: 'squat-cable', name: 'Cable Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'cable', isCustom: false },
  { id: 'lunge-cable', name: 'Cable Lunge', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'cable', isCustom: false },
  { id: 'step-up-cable', name: 'Cable Step Up', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'cable', isCustom: false },
  { id: 'leg-extension-cable', name: 'Cable Leg Extension', primaryMuscle: 'quads', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  // Quads - Machine
  { id: 'leg-press', name: 'Leg Press', primaryMuscle: 'quads', secondaryMuscles: '["glutes","hamstrings"]', equipment: 'machine', isCustom: false },
  { id: 'leg-extension', name: 'Leg Extension', primaryMuscle: 'quads', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
  { id: 'hack-squat', name: 'Hack Squat', primaryMuscle: 'quads', secondaryMuscles: '["glutes"]', equipment: 'machine', isCustom: false },

  // Hamstrings - Barbell
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: '["glutes","back"]', equipment: 'barbell', isCustom: false },
  { id: 'stiff-leg-deadlift', name: 'Stiff Leg Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: '["glutes","back"]', equipment: 'barbell', isCustom: false },
  { id: 'good-morning', name: 'Good Morning', primaryMuscle: 'hamstrings', secondaryMuscles: '["back","glutes"]', equipment: 'barbell', isCustom: false },
  { id: 'seated-good-morning-barbell', name: 'Seated Good Morning', primaryMuscle: 'hamstrings', secondaryMuscles: '["back","glutes"]', equipment: 'barbell', isCustom: false },
  { id: 'glute-ham-raise-barbell', name: 'Glute Ham Raise', primaryMuscle: 'hamstrings', secondaryMuscles: '["glutes"]', equipment: 'barbell', isCustom: false },
  // Hamstrings - Dumbbell
  { id: 'romanian-deadlift-hamstrings-dumbbell', name: 'Dumbbell Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: '["glutes","back"]', equipment: 'dumbbell', isCustom: false },
  { id: 'stiff-leg-deadlift-dumbbell', name: 'Dumbbell Stiff Leg Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: '["glutes","back"]', equipment: 'dumbbell', isCustom: false },
  { id: 'lying-leg-curl-dumbbell', name: 'Dumbbell Lying Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  // Hamstrings - Cable
  { id: 'romanian-deadlift-cable', name: 'Cable Romanian Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: '["glutes","back"]', equipment: 'cable', isCustom: false },
  { id: 'stiff-leg-deadlift-cable', name: 'Cable Stiff Leg Deadlift', primaryMuscle: 'hamstrings', secondaryMuscles: '["glutes","back"]', equipment: 'cable', isCustom: false },
  { id: 'lying-leg-curl-cable', name: 'Cable Lying Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'standing-leg-curl-cable', name: 'Cable Standing Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  // Hamstrings - Machine
  { id: 'leg-curl-lying', name: 'Lying Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
  { id: 'leg-curl-seated', name: 'Seated Leg Curl', primaryMuscle: 'hamstrings', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },

  // Glutes - Barbell
  { id: 'hip-thrust', name: 'Hip Thrust', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings"]', equipment: 'barbell', isCustom: false },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings","back"]', equipment: 'barbell', isCustom: false },
  { id: 'squat-glutes-barbell', name: 'Barbell Squat', primaryMuscle: 'glutes', secondaryMuscles: '["quads","hamstrings"]', equipment: 'barbell', isCustom: false },
  { id: 'sumo-squat-barbell', name: 'Barbell Sumo Squat', primaryMuscle: 'glutes', secondaryMuscles: '["quads"]', equipment: 'barbell', isCustom: false },
  { id: 'romanian-deadlift-glutes', name: 'Romanian Deadlift', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings","back"]', equipment: 'barbell', isCustom: false },
  { id: 'lunge-glutes-barbell', name: 'Barbell Lunge', primaryMuscle: 'glutes', secondaryMuscles: '["quads","hamstrings"]', equipment: 'barbell', isCustom: false },
  { id: 'reverse-lunge-glutes-barbell', name: 'Barbell Reverse Lunge', primaryMuscle: 'glutes', secondaryMuscles: '["quads","hamstrings"]', equipment: 'barbell', isCustom: false },
  { id: 'step-up-glutes-barbell', name: 'Barbell Step Up', primaryMuscle: 'glutes', secondaryMuscles: '["quads"]', equipment: 'barbell', isCustom: false },
  { id: 'bulgarian-split-squat-glutes', name: 'Bulgarian Split Squat', primaryMuscle: 'glutes', secondaryMuscles: '["quads"]', equipment: 'barbell', isCustom: false },
  // Glutes - Dumbbell
  { id: 'hip-thrust-dumbbell', name: 'Dumbbell Hip Thrust', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings"]', equipment: 'dumbbell', isCustom: false },
  { id: 'sumo-squat-dumbbell', name: 'Dumbbell Sumo Squat', primaryMuscle: 'glutes', secondaryMuscles: '["quads"]', equipment: 'dumbbell', isCustom: false },
  { id: 'lunge-glutes-dumbbell', name: 'Dumbbell Lunge', primaryMuscle: 'glutes', secondaryMuscles: '["quads","hamstrings"]', equipment: 'dumbbell', isCustom: false },
  { id: 'reverse-lunge-glutes-dumbbell', name: 'Dumbbell Reverse Lunge', primaryMuscle: 'glutes', secondaryMuscles: '["quads","hamstrings"]', equipment: 'dumbbell', isCustom: false },
  { id: 'walking-lunge-glutes-dumbbell', name: 'Dumbbell Walking Lunge', primaryMuscle: 'glutes', secondaryMuscles: '["quads","hamstrings"]', equipment: 'dumbbell', isCustom: false },
  { id: 'step-up-glutes-dumbbell', name: 'Dumbbell Step Up', primaryMuscle: 'glutes', secondaryMuscles: '["quads"]', equipment: 'dumbbell', isCustom: false },
  { id: 'bulgarian-split-squat-glutes-dumbbell', name: 'Dumbbell Bulgarian Split Squat', primaryMuscle: 'glutes', secondaryMuscles: '["quads"]', equipment: 'dumbbell', isCustom: false },
  // Glutes - Cable
  { id: 'cable-kickback', name: 'Cable Kickback', primaryMuscle: 'glutes', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'standing-hip-extension-cable', name: 'Cable Standing Hip Extension', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings"]', equipment: 'cable', isCustom: false },
  { id: 'cable-pull-through', name: 'Cable Pull Through', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings"]', equipment: 'cable', isCustom: false },
  { id: 'squat-glutes-cable', name: 'Cable Squat', primaryMuscle: 'glutes', secondaryMuscles: '["quads"]', equipment: 'cable', isCustom: false },
  { id: 'lunge-glutes-cable', name: 'Cable Lunge', primaryMuscle: 'glutes', secondaryMuscles: '["quads","hamstrings"]', equipment: 'cable', isCustom: false },
  { id: 'step-up-glutes-cable', name: 'Cable Step Up', primaryMuscle: 'glutes', secondaryMuscles: '["quads"]', equipment: 'cable', isCustom: false },
  // Glutes - Bodyweight
  { id: 'glute-bridge', name: 'Glute Bridge', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings"]', equipment: 'bodyweight', isCustom: false },
  { id: 'single-leg-glute-bridge', name: 'Single Leg Glute Bridge', primaryMuscle: 'glutes', secondaryMuscles: '["hamstrings"]', equipment: 'bodyweight', isCustom: false },

  // Core
  { id: 'plank', name: 'Plank', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },
  { id: 'crunch', name: 'Crunch', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },
  { id: 'leg-raise', name: 'Leg Raise', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },
  { id: 'cable-crunch', name: 'Cable Crunch', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'russian-twist', name: 'Russian Twist', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },
  { id: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', primaryMuscle: 'core', secondaryMuscles: '[]', equipment: 'bodyweight', isCustom: false },

  // Calves - Barbell
  { id: 'standing-calf-raise-barbell', name: 'Barbell Standing Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  { id: 'seated-calf-raise-barbell', name: 'Barbell Seated Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'barbell', isCustom: false },
  // Calves - Dumbbell
  { id: 'standing-calf-raise-dumbbell', name: 'Dumbbell Standing Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'single-leg-calf-raise-dumbbell', name: 'Dumbbell Single Leg Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'seated-calf-raise-dumbbell', name: 'Dumbbell Seated Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  { id: 'reverse-calf-raise-dumbbell', name: 'Dumbbell Reverse Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'dumbbell', isCustom: false },
  // Calves - Cable
  { id: 'standing-calf-raise-cable', name: 'Cable Standing Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  { id: 'donkey-calf-raise-cable', name: 'Cable Donkey Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'cable', isCustom: false },
  // Calves - Machine
  { id: 'standing-calf-raise', name: 'Standing Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
  { id: 'leg-press-calf-raise', name: 'Leg Press Calf Raise', primaryMuscle: 'calves', secondaryMuscles: '[]', equipment: 'machine', isCustom: false },
];

export async function seedExercises() {
  // Insert all exercises, skip if ID already exists (safe upsert)
  for (const exercise of EXERCISE_DATA) {
    await db.insert(exercises).values(exercise).onConflictDoNothing();
  }
}

export async function seedDefaultTemplates() {
  // Check if templates already exist
  const existingTemplates = await db.select().from(workoutTemplates).limit(1);
  if (existingTemplates.length > 0) {
    return; // Already seeded
  }

  const now = new Date();

  // Create the 4-Day Upper/Lower split container
  await db.insert(workoutSplits).values({
    id: 'upper-lower-4day',
    name: '4-Day Upper/Lower',
    description: 'Classic upper/lower split with 4 training days per week',
    createdAt: now,
  });

  // Upper A template
  await db.insert(workoutTemplates).values({
    id: 'upper-a',
    splitId: 'upper-lower-4day',
    name: 'Upper A',
    type: 'upper',
    orderIndex: 0,
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
    splitId: 'upper-lower-4day',
    name: 'Upper B',
    type: 'upper',
    orderIndex: 1,
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
    splitId: 'upper-lower-4day',
    name: 'Lower A',
    type: 'lower',
    orderIndex: 2,
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
    splitId: 'upper-lower-4day',
    name: 'Lower B',
    type: 'lower',
    orderIndex: 3,
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
  // Don't seed default templates - let users create their own
}
