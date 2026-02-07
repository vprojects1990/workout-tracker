import { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, View as RNView, Alert } from 'react-native';
import { Text, View, useColors } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTemplateExercises } from '@/hooks/useWorkoutTemplates';
import { ExercisePickerModal, EQUIPMENT_LABELS } from '@/components/workout';
import { useSettings, convertWeight, convertToKg, WeightUnit } from '@/hooks/useSettings';
import { useActiveWorkoutContext, WorkoutExercise, SetData } from '@/contexts/ActiveWorkoutContext';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/db';
import { workoutTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { Card, Button, SegmentedControl, SwipeableRow } from '@/components/ui';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';


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
  const { settings } = useSettings();

  // Use context for persistent workout state
  const {
    activeWorkout,
    hasActiveWorkout,
    isLoading: contextLoading,
    elapsedSeconds,
    restSeconds,
    startWorkout,
    completeSet: contextCompleteSet,
    addSet: contextAddSet,
    removeSet: contextRemoveSet,
    addExercise: contextAddExercise,
    removeExercise: contextRemoveExercise,
    updateExerciseSettings: contextUpdateExerciseSettings,
    completeWorkout: contextCompleteWorkout,
    abandonWorkout,
    startRestTimer,
    dismissRestTimer,
  } = useActiveWorkoutContext();

  // Local UI state only
  const [isComplete, setIsComplete] = useState(false);
  const [showRestOverlay, setShowRestOverlay] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [activeExerciseMenu, setActiveExerciseMenu] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const templateNameRef = useRef<string>('Workout');
  const soundRef = useRef<Audio.Sound | null>(null);

  const weightUnit = settings.weightUnit as WeightUnit;
  const defaultRestSeconds = settings.defaultRestSeconds;

  // Fetch template name
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

  // Initialize workout if not already active
  useEffect(() => {
    if (contextLoading || exercisesLoading || initialized) return;

    // If there's already an active workout for this template, don't re-initialize
    if (hasActiveWorkout && activeWorkout?.templateId === id) {
      setInitialized(true);
      return;
    }

    // If there's an active workout for a different template, just show it
    if (hasActiveWorkout) {
      setInitialized(true);
      return;
    }

    // Start a new workout
    if (templateExercises.length > 0) {
      const initialExercises: WorkoutExercise[] = templateExercises.map(ex => ({
        id: `${ex.exerciseId}-${Date.now()}-${Math.random()}`,
        exerciseId: ex.exerciseId,
        name: ex.name,
        equipment: ex.equipment,
        sets: [{
          id: `pending-${Date.now()}`,
          setNumber: 1,
          reps: null,
          weight: null,
          completed: false,
          dbSynced: false,
        }],
        settings: { restSecondsOverride: null, weightUnitOverride: null },
      }));

      startWorkout(id || null, templateNameRef.current, initialExercises);
      setInitialized(true);
    }
  }, [contextLoading, exercisesLoading, initialized, hasActiveWorkout, activeWorkout, templateExercises, id, startWorkout]);

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

  // Timer completion effect - play sound when rest timer hits 0
  useEffect(() => {
    if (restSeconds === 0) {
      soundRef.current?.replayAsync();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowRestOverlay(false);
    }
  }, [restSeconds]);

  // Show rest overlay when rest timer starts
  useEffect(() => {
    if (restSeconds !== null && restSeconds > 0) {
      setShowRestOverlay(true);
    }
  }, [restSeconds]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Workout?',
      'Your progress has been saved. You can resume later from the workout tab.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Save & Exit',
          onPress: () => router.back(),
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await abandonWorkout();
            router.back();
          },
        },
      ]
    );
  };

  const handleAddExercise = (exercise: { id: string; name: string; equipment: string; primaryMuscle: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    contextAddExercise({
      exerciseId: exercise.id,
      name: exercise.name,
      equipment: exercise.equipment,
    });
    setShowExercisePicker(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    contextRemoveExercise(exerciseId);
  };

  const handleAddSet = (exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    contextAddSet(exerciseId);
  };

  const handleRemoveSet = (exerciseId: string, setNumber: number) => {
    Haptics.selectionAsync();
    contextRemoveSet(exerciseId, setNumber);
  };

  const handleCompleteSet = async (
    exerciseId: string,
    setNumber: number,
    reps: number,
    weight: number,
    effectiveWeightUnit: WeightUnit
  ) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const exercise = activeWorkout?.exercises.find(e => e.id === exerciseId);
    const effectiveRestSeconds = exercise?.settings.restSecondsOverride ?? defaultRestSeconds;

    // Convert to kg for storage
    const weightInKg = convertToKg(weight, effectiveWeightUnit);
    await contextCompleteSet(exerciseId, setNumber, reps, weightInKg);

    // Start rest timer
    startRestTimer(effectiveRestSeconds);
  };

  const handleCompleteWorkout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await contextCompleteWorkout();
    setIsComplete(true);
  };

  const handleUpdateExerciseSettings = (
    exerciseId: string,
    settings: { restSecondsOverride?: number | null; weightUnitOverride?: WeightUnit | null }
  ) => {
    contextUpdateExerciseSettings(exerciseId, settings);
  };

  const getActiveExercise = () => activeWorkout?.exercises.find(e => e.id === activeExerciseMenu);

  // Loading state
  if (exercisesLoading || contextLoading || !initialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  // Complete state
  if (isComplete) {
    const completedSets = activeWorkout?.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
      0
    ) ?? 0;

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
          {activeWorkout?.exercises.length ?? 0} exercises · {completedSets} sets
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

  // No active workout (shouldn't happen but handle gracefully)
  if (!activeWorkout) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>No active workout</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="secondary" style={{ marginTop: Spacing.lg }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Pressable onPress={handleCancel}>
          <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
        </Pressable>
        <View style={[styles.timerContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.timer, { color: colors.text }]}>{formatTime(elapsedSeconds)}</Text>
        </View>
        <Pressable onPress={handleCompleteWorkout}>
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
          {activeWorkout.exercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              weightUnit={weightUnit}
              colors={colors}
              onRemoveExercise={() => handleRemoveExercise(exercise.id)}
              onAddSet={() => handleAddSet(exercise.id)}
              onRemoveSet={(setNumber) => handleRemoveSet(exercise.id, setNumber)}
              onCompleteSet={(setNumber, reps, weight, effectiveWeightUnit) =>
                handleCompleteSet(exercise.id, setNumber, reps, weight, effectiveWeightUnit)
              }
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
      <ExercisePickerModal
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelect={handleAddExercise}
      />

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
                    handleUpdateExerciseSettings(activeExerciseMenu, {
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
                    handleUpdateExerciseSettings(activeExerciseMenu, {
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
    // Validate: reps must be positive, weight must be non-negative
    if (!isNaN(repsNum) && !isNaN(weightNum) && repsNum > 0 && weightNum >= 0) {
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
