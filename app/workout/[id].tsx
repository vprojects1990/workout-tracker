import { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, View as RNView } from 'react-native';
import { Text, View, useColors } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTemplateExercises, useAllExercises } from '@/hooks/useWorkoutTemplates';
import { useSettings, convertWeight, convertToKg, WeightUnit } from '@/hooks/useSettings';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/db';
import { workoutSessions, setLogs, workoutTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Card, Button, Badge, Input, SegmentedControl, SwipeableRow } from '@/components/ui';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
};

type ExerciseSettings = {
  restSecondsOverride: number | null;
  weightUnitOverride: WeightUnit | null;
};

type WorkoutExercise = {
  id: string;
  exerciseId: string;
  name: string;
  equipment: string;
  sets: SetData[];
  settings: ExerciseSettings;
};

type SetData = {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  completed: boolean;
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ':' + secs.toString().padStart(2, '0');
}

export default function ActiveWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { exercises: templateExercises, loading: exercisesLoading } = useTemplateExercises(id || null);
  const { exercises: allExercises } = useAllExercises();
  const { settings } = useSettings();

  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [showRestOverlay, setShowRestOverlay] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [activeExerciseMenu, setActiveExerciseMenu] = useState<string | null>(null);

  const startTimeRef = useRef<Date>(new Date());
  const templateNameRef = useRef<string>('Workout');
  const soundRef = useRef<Audio.Sound | null>(null);

  const weightUnit = settings.weightUnit as WeightUnit;
  const defaultRestSeconds = settings.defaultRestSeconds;

  // Initialize workout exercises from template
  useEffect(() => {
    if (!exercisesLoading && templateExercises.length > 0 && !initialized) {
      const initialExercises: WorkoutExercise[] = templateExercises.map(ex => ({
        id: `${ex.exerciseId}-${Date.now()}-${Math.random()}`,
        exerciseId: ex.exerciseId,
        name: ex.name,
        equipment: ex.equipment,
        sets: [{ setNumber: 1, reps: null, weight: null, completed: false }],
        settings: { restSecondsOverride: null, weightUnitOverride: null },
      }));
      setWorkoutExercises(initialExercises);
      setInitialized(true);
    }
  }, [templateExercises, exercisesLoading, initialized]);

  // Timer effect
  useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  // Rest timer effect
  useEffect(() => {
    if (restSeconds === null || restSeconds <= 0) return;
    const interval = setInterval(() => {
      setRestSeconds(prev => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [restSeconds]);

  // Load sound effect
  useEffect(() => {
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/timer-complete.mp3')
      );
      soundRef.current = sound;
    };
    loadSound();
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Timer completion effect
  useEffect(() => {
    if (restSeconds === 0) {
      soundRef.current?.replayAsync();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRestSeconds(null);
      setShowRestOverlay(false);
    }
  }, [restSeconds]);

  // Fetch template name for history display
  useEffect(() => {
    if (!id) return;

    async function fetchTemplateName() {
      const result = await db
        .select({ name: workoutTemplates.name })
        .from(workoutTemplates)
        .where(eq(workoutTemplates.id, id))
        .limit(1);

      if (result[0]) {
        templateNameRef.current = result[0].name;
      }
    }

    fetchTemplateName();
  }, [id]);

  const addExercise = (exercise: { id: string; name: string; equipment: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newExercise: WorkoutExercise = {
      id: `${exercise.id}-${Date.now()}`,
      exerciseId: exercise.id,
      name: exercise.name,
      equipment: exercise.equipment,
      sets: [{ setNumber: 1, reps: null, weight: null, completed: false }],
      settings: { restSecondsOverride: null, weightUnitOverride: null },
    };
    setWorkoutExercises(prev => [...prev, newExercise]);
    setShowExercisePicker(false);
    setSearchQuery('');
  };

  const removeExercise = (exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWorkoutExercises(prev => prev.filter(e => e.id !== exerciseId));
  };

  const addSet = (exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWorkoutExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const nextSetNumber = ex.sets.length + 1;
      return {
        ...ex,
        sets: [...ex.sets, { setNumber: nextSetNumber, reps: null, weight: null, completed: false }],
      };
    }));
  };

  const removeSet = (exerciseId: string, setNumber: number) => {
    Haptics.selectionAsync();
    setWorkoutExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      if (ex.sets.length <= 1) return ex;
      const newSets = ex.sets
        .filter(s => s.setNumber !== setNumber)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      return { ...ex, sets: newSets };
    }));
  };

  const completeSet = (exerciseId: string, setNumber: number, reps: number, weight: number, effectiveWeightUnit: WeightUnit) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const exercise = workoutExercises.find(e => e.id === exerciseId);
    const effectiveRestSeconds = exercise?.settings.restSecondsOverride ?? defaultRestSeconds;

    setWorkoutExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.map(s =>
          s.setNumber === setNumber
            ? { ...s, reps, weight: convertToKg(weight, effectiveWeightUnit), completed: true }
            : s
        ),
      };
    }));
    setRestSeconds(effectiveRestSeconds);
    setShowRestOverlay(true);
  };

  const completeWorkout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const sessionId = 'session-' + Date.now();
    const now = new Date();

    await db.insert(workoutSessions).values({
      id: sessionId,
      templateId: id || null,
      templateName: templateNameRef.current,
      startedAt: startTimeRef.current,
      completedAt: now,
      durationSeconds: elapsedSeconds,
    });

    for (const exercise of workoutExercises) {
      for (const set of exercise.sets) {
        if (set.completed && set.reps !== null && set.weight !== null) {
          await db.insert(setLogs).values({
            id: `${sessionId}-${exercise.exerciseId}-${set.setNumber}`,
            sessionId,
            exerciseId: exercise.exerciseId,
            setNumber: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            restSeconds: defaultRestSeconds,
          });
        }
      }
    }

    setIsComplete(true);
  };

  const filteredExercises = allExercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedExercises = filteredExercises.reduce((acc, ex) => {
    const muscle = ex.primaryMuscle;
    if (!acc[muscle]) acc[muscle] = [];
    acc[muscle].push(ex);
    return acc;
  }, {} as Record<string, typeof filteredExercises>);

  const getActiveExercise = () => workoutExercises.find(e => e.id === activeExerciseMenu);

  const updateExerciseSettings = (exerciseId: string, updates: Partial<ExerciseSettings>) => {
    setWorkoutExercises(prev => prev.map(ex =>
      ex.id === exerciseId
        ? { ...ex, settings: { ...ex.settings, ...updates } }
        : ex
    ));
  };

  if (exercisesLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  if (isComplete) {
    return (
      <View style={[styles.completeContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.completeIconContainer, { backgroundColor: colors.success + '20' }]}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} />
        </View>
        <Text style={[styles.completeTitle, { color: colors.text }]}>Workout Complete!</Text>
        <Text style={[styles.completeTime, { color: colors.textSecondary }]}>
          Duration: {formatTime(elapsedSeconds)}
        </Text>
        <Text style={[styles.completeStats, { color: colors.textTertiary }]}>
          {workoutExercises.length} exercises · {workoutExercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)} sets
        </Text>
        <Button
          title="Done"
          onPress={() => router.back()}
          variant="primary"
          size="lg"
          style={styles.doneButton}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
        </Pressable>
        <View style={[styles.timerContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.timer, { color: colors.text }]}>{formatTime(elapsedSeconds)}</Text>
        </View>
        <Pressable onPress={completeWorkout}>
          <Text style={[styles.finishText, { color: colors.success }]}>Finish</Text>
        </Pressable>
      </View>

      {restSeconds !== null && restSeconds > 0 && showRestOverlay && (
        <Pressable style={styles.restOverlay} onPress={() => setShowRestOverlay(false)}>
          <BlurView intensity={90} tint="dark" style={styles.restBlur}>
            <RNView style={[styles.restCard, { backgroundColor: colors.cardElevated }]}>
              <Text style={[styles.restTitle, { color: colors.textTertiary }]}>Rest Timer</Text>
              <Text style={[styles.restTime, { color: colors.success }]}>{formatTime(restSeconds)}</Text>
              <Text style={[styles.restTap, { color: colors.textTertiary }]}>Tap anywhere to dismiss</Text>
            </RNView>
          </BlurView>
        </Pressable>
      )}

      {restSeconds !== null && restSeconds > 0 && !showRestOverlay && (
        <Pressable
          style={[styles.miniTimerBadge, { backgroundColor: colors.cardElevated }]}
          onPress={() => setShowRestOverlay(true)}
        >
          <Ionicons name="timer-outline" size={16} color={colors.success} />
          <Text style={[styles.miniTimerText, { color: colors.success }]}>{formatTime(restSeconds)}</Text>
        </Pressable>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {workoutExercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              weightUnit={weightUnit}
              colors={colors}
              onRemoveExercise={() => removeExercise(exercise.id)}
              onAddSet={() => addSet(exercise.id)}
              onRemoveSet={(setNumber) => removeSet(exercise.id, setNumber)}
              onCompleteSet={(setNumber, reps, weight, effectiveWeightUnit) => completeSet(exercise.id, setNumber, reps, weight, effectiveWeightUnit)}
              onOpenMenu={() => setActiveExerciseMenu(exercise.id)}
            />
          ))}

          <Pressable
            style={[styles.addExerciseButton, { backgroundColor: colors.primary + '15' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowExercisePicker(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={[styles.addExerciseText, { color: colors.primary }]}>Add Exercise</Text>
          </Pressable>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Exercise Picker Modal */}
      <Modal visible={showExercisePicker} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={60}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Exercise</Text>
              <Pressable onPress={() => { setShowExercisePicker(false); setSearchQuery(''); }}>
                <Ionicons name="close-circle-outline" size={28} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
                placeholder="Search exercises..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={styles.exerciseList} keyboardShouldPersistTaps="handled">
              {Object.entries(groupedExercises).map(([muscle, exercises]) => (
                <View key={muscle} style={styles.muscleGroup}>
                  <Text style={[styles.muscleTitle, { color: colors.textTertiary }]}>
                    {MUSCLE_LABELS[muscle] || muscle}
                  </Text>
                  {exercises.map(ex => (
                    <Pressable
                      key={ex.id}
                      style={[styles.exerciseItem, { borderBottomColor: colors.separator }]}
                      onPress={() => addExercise(ex)}
                    >
                      <Text style={[styles.exerciseItemName, { color: colors.text }]}>{ex.name}</Text>
                      <Text style={[styles.exerciseItemEquipment, { color: colors.textTertiary }]}>
                        {EQUIPMENT_LABELS[ex.equipment]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Exercise Settings Action Sheet */}
      <Modal
        visible={activeExerciseMenu !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveExerciseMenu(null)}
      >
        <Pressable
          style={styles.actionSheetOverlay}
          onPress={() => setActiveExerciseMenu(null)}
        >
          <Pressable
            style={[styles.actionSheet, { backgroundColor: colors.cardElevated }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.actionSheetHandle} />

            <Text style={[styles.actionSheetTitle, { color: colors.text }]}>
              {getActiveExercise()?.name} Settings
            </Text>

            {/* Rest Timer Setting */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Rest Timer</Text>
              <SegmentedControl
                options={[
                  { label: '60s', value: '60' },
                  { label: '90s', value: '90' },
                  { label: '120s', value: '120' },
                ]}
                selectedValue={String(getActiveExercise()?.settings.restSecondsOverride ?? defaultRestSeconds)}
                onValueChange={(value) => {
                  if (activeExerciseMenu) {
                    updateExerciseSettings(activeExerciseMenu, {
                      restSecondsOverride: parseInt(value, 10)
                    });
                  }
                }}
              />
            </View>

            {/* Weight Unit Setting */}
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Weight Unit</Text>
              <SegmentedControl
                options={[
                  { label: 'kg', value: 'kg' },
                  { label: 'lbs', value: 'lbs' },
                ]}
                selectedValue={getActiveExercise()?.settings.weightUnitOverride ?? weightUnit}
                onValueChange={(value) => {
                  if (activeExerciseMenu) {
                    updateExerciseSettings(activeExerciseMenu, {
                      weightUnitOverride: value as WeightUnit
                    });
                  }
                }}
              />
            </View>

            <Button
              title="Done"
              onPress={() => setActiveExerciseMenu(null)}
              variant="primary"
              style={{ marginTop: Spacing.lg }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function ExerciseCard({
  exercise,
  weightUnit,
  colors,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  onCompleteSet,
  onOpenMenu,
}: {
  exercise: WorkoutExercise;
  weightUnit: WeightUnit;
  colors: ReturnType<typeof useColors>;
  onRemoveExercise: () => void;
  onAddSet: () => void;
  onRemoveSet: (setNumber: number) => void;
  onCompleteSet: (setNumber: number, reps: number, weight: number, effectiveWeightUnit: WeightUnit) => void;
  onOpenMenu: () => void;
}) {
  const effectiveWeightUnit = exercise.settings.weightUnitOverride ?? weightUnit;

  return (
    <SwipeableRow onDelete={onRemoveExercise}>
      <Card variant="filled" style={styles.exerciseCard} padding="md">
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseInfo}>
            <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
            <Text style={[styles.exerciseEquipment, { color: colors.textTertiary }]}>
              {EQUIPMENT_LABELS[exercise.equipment]}
            </Text>
          </View>
          <Pressable onPress={onOpenMenu} style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

      <View style={styles.setsContainer}>
        <View style={styles.setHeaderRow}>
          <Text style={[styles.setHeaderText, { color: colors.textTertiary }]}>Set</Text>
          <Text style={[styles.setHeaderText, { color: colors.textTertiary }]}>{effectiveWeightUnit}</Text>
          <Text style={[styles.setHeaderText, { color: colors.textTertiary }]}>Reps</Text>
          <Text style={[styles.setHeaderText, { color: colors.textTertiary }]}></Text>
        </View>

        {exercise.sets.map(set => (
          <SetRow
            key={set.setNumber}
            set={set}
            weightUnit={effectiveWeightUnit}
            colors={colors}
            onComplete={(reps, weight) => onCompleteSet(set.setNumber, reps, weight, effectiveWeightUnit)}
            onRemove={() => onRemoveSet(set.setNumber)}
            canRemove={exercise.sets.length > 1}
          />
        ))}

        <Pressable style={styles.addSetButton} onPress={onAddSet}>
          <Text style={[styles.addSetText, { color: colors.primary }]}>+ Add Set</Text>
        </Pressable>
      </View>
      </Card>
    </SwipeableRow>
  );
}

function SetRow({
  set,
  weightUnit,
  colors,
  onComplete,
  onRemove,
  canRemove,
}: {
  set: SetData;
  weightUnit: WeightUnit;
  colors: ReturnType<typeof useColors>;
  onComplete: (reps: number, weight: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const handleComplete = () => {
    const repsNum = parseInt(reps, 10);
    const weightNum = parseFloat(weight);
    if (!isNaN(repsNum) && !isNaN(weightNum)) {
      onComplete(repsNum, weightNum);
    }
  };

  if (set.completed) {
    return (
      <View style={styles.setRow}>
        <Text style={[styles.setNumber, { color: colors.text }]}>{set.setNumber}</Text>
        <Text style={[styles.setWeight, { color: colors.text }]}>
          {set.weight !== null ? convertWeight(set.weight, weightUnit) : '-'}
        </Text>
        <Text style={[styles.setReps, { color: colors.text }]}>{set.reps}</Text>
        <View style={[styles.completedBadge, { backgroundColor: colors.success + '20' }]}>
          <Ionicons name="checkmark" size={18} color={colors.success} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.setRow}>
      <View style={styles.setNumberContainer}>
        <Text style={[styles.setNumber, { color: colors.text }]}>{set.setNumber}</Text>
        {canRemove && (
          <Pressable onPress={onRemove} style={styles.removeSetButton}>
            <Ionicons name="close-circle" size={16} color={colors.error} />
          </Pressable>
        )}
      </View>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
        value={weight}
        onChangeText={setWeight}
        placeholder={weightUnit}
        keyboardType="decimal-pad"
        placeholderTextColor={colors.textTertiary}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
        value={reps}
        onChangeText={setReps}
        placeholder="Reps"
        keyboardType="number-pad"
        placeholderTextColor={colors.textTertiary}
      />
      <Pressable
        style={[styles.completeButton, { backgroundColor: colors.success }]}
        onPress={handleComplete}
      >
        <Ionicons name="checkmark" size={18} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  cancelText: { ...Typography.body, fontWeight: '500' },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.medium,
  },
  timer: { ...Typography.headline },
  finishText: { ...Typography.body, fontWeight: '600' },
  scrollView: { flex: 1 },
  exerciseCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  exerciseInfo: { flex: 1, backgroundColor: 'transparent' },
  exerciseName: { ...Typography.headline },
  exerciseEquipment: { ...Typography.footnote, marginTop: 2 },
  removeButton: { padding: Spacing.sm },
  setsContainer: { marginTop: Spacing.md },
  setHeaderRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    backgroundColor: 'transparent',
  },
  setHeaderText: { flex: 1, ...Typography.caption1, textAlign: 'center' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: 'transparent',
  },
  setNumberContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  setNumber: { ...Typography.body, fontWeight: '600', marginRight: 4 },
  removeSetButton: { padding: 2 },
  setWeight: { flex: 1, textAlign: 'center', ...Typography.body },
  setReps: { flex: 1, textAlign: 'center', ...Typography.body },
  completedBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: Radius.medium,
  },
  input: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.small,
    textAlign: 'center',
    ...Typography.footnote,
  },
  completeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.small,
    marginLeft: 3,
  },
  addSetButton: { padding: Spacing.sm, alignItems: 'center', marginTop: Spacing.sm },
  addSetText: { ...Typography.subhead, fontWeight: '500' },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.large,
    gap: Spacing.sm,
  },
  addExerciseText: { ...Typography.headline },
  bottomPadding: { height: 100 },
  // Modal styles
  modalContainer: { flex: 1, paddingTop: 60 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: { ...Typography.title2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
  },
  searchIcon: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    padding: Spacing.md,
    paddingLeft: 44,
    borderRadius: Radius.medium,
    ...Typography.body,
  },
  exerciseList: { flex: 1 },
  muscleGroup: { marginBottom: Spacing.lg },
  muscleTitle: {
    ...Typography.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  exerciseItemName: { ...Typography.body },
  exerciseItemEquipment: { ...Typography.footnote },
  // Complete screen
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  completeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  completeTitle: { ...Typography.largeTitle },
  completeTime: { ...Typography.subhead, marginTop: Spacing.sm },
  completeStats: { ...Typography.footnote, marginTop: Spacing.xs },
  doneButton: { marginTop: Spacing.xxl, minWidth: 200 },
  // Rest overlay
  restOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  restBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restCard: {
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    minWidth: 200,
  },
  restTitle: { ...Typography.footnote, textTransform: 'uppercase', letterSpacing: 1 },
  restTime: { fontSize: 56, fontWeight: 'bold', marginTop: Spacing.md, marginBottom: Spacing.lg },
  restTap: { ...Typography.footnote },
  // Mini timer badge
  miniTimerBadge: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 50,
  },
  miniTimerText: {
    fontWeight: '600',
    fontSize: 14,
  },
  // Action sheet styles
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  actionSheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  actionSheetTitle: {
    ...Typography.headline,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  settingRow: {
    marginBottom: Spacing.lg,
  },
  settingLabel: {
    ...Typography.subhead,
    marginBottom: Spacing.sm,
  },
  menuButton: {
    padding: Spacing.sm,
  },
});
