import { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform, View as RNView, Alert } from 'react-native';
import { Text, View, useColors } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { useSettings, convertWeight, convertToKg, WeightUnit } from '@/hooks/useSettings';
import { useAllExercises } from '@/hooks/useWorkoutTemplates';
import { useActiveWorkoutContext, WorkoutExercise, SetData } from '@/contexts/ActiveWorkoutContext';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

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

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ':' + secs.toString().padStart(2, '0');
}

export default function EmptyWorkoutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = useColors();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';
  const { settings } = useSettings();
  const { exercises: allExercises } = useAllExercises();

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
    completeWorkout: contextCompleteWorkout,
    abandonWorkout,
    startRestTimer,
    dismissRestTimer,
  } = useActiveWorkoutContext();

  // Local UI state only
  const [isComplete, setIsComplete] = useState(false);
  const [showRestOverlay, setShowRestOverlay] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialized, setInitialized] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const weightUnit = settings.weightUnit as WeightUnit;
  const defaultRestSeconds = settings.defaultRestSeconds;

  // Initialize empty workout if not already active
  useEffect(() => {
    if (contextLoading || initialized) return;

    // If there's already an active workout (any), don't re-initialize
    if (hasActiveWorkout) {
      setInitialized(true);
      return;
    }

    // Start a new empty workout with no exercises
    const initWorkout = async () => {
      try {
        await startWorkout(null, 'Empty Workout', []);
        setInitialized(true);
      } catch (error) {
        Alert.alert('Error', 'Failed to start workout session.');
        router.back();
      }
    };
    initWorkout();
  }, [contextLoading, initialized, hasActiveWorkout, startWorkout, router]);

  // Load sound effect
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/sounds/timer-complete.mp3')
        );
        soundRef.current = sound;
      } catch (error) {
        console.warn('Failed to load timer sound:', error);
      }
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
      dismissRestTimer();
      setShowRestOverlay(false);
    }
  }, [restSeconds, dismissRestTimer]);

  const handleAddExercise = (exercise: { id: string; name: string; equipment: string }) => {
    contextAddExercise({
      exerciseId: exercise.id,
      name: exercise.name,
      equipment: exercise.equipment,
    });
    setShowExercisePicker(false);
    setSearchQuery('');
  };

  const handleRemoveExercise = (exerciseInstanceId: string) => {
    contextRemoveExercise(exerciseInstanceId);
  };

  const handleAddSet = (exerciseInstanceId: string) => {
    contextAddSet(exerciseInstanceId);
  };

  const handleRemoveSet = (exerciseInstanceId: string, setNumber: number) => {
    contextRemoveSet(exerciseInstanceId, setNumber);
  };

  const handleCompleteSet = async (exerciseInstanceId: string, setNumber: number, reps: number, weight: number) => {
    try {
      const weightInKg = convertToKg(weight, weightUnit);
      await contextCompleteSet(exerciseInstanceId, setNumber, reps, weightInKg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      startRestTimer(defaultRestSeconds);
      setShowRestOverlay(true);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save set. Please try again.');
    }
  };

  const handleCompleteWorkout = async () => {
    try {
      await contextCompleteWorkout();
      setIsComplete(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete workout. Please try again.');
    }
  };

  const handleCancel = () => {
    if (hasActiveWorkout && activeWorkout && activeWorkout.exercises.some(ex => ex.sets.some(s => s.completed))) {
      Alert.alert(
        'Discard Workout?',
        'You have completed sets. Are you sure you want to discard this workout?',
        [
          { text: 'Keep Going', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: async () => {
            try {
              await abandonWorkout();
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to discard workout. Please try again.');
            }
          }},
        ]
      );
    } else if (hasActiveWorkout) {
      abandonWorkout().then(() => router.back()).catch(() => {
        Alert.alert('Error', 'Failed to discard workout. Please try again.');
      });
    } else {
      router.back();
    }
  };

  const filteredExercises = allExercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group exercises by muscle
  const groupedExercises = filteredExercises.reduce((acc, ex) => {
    const muscle = ex.primaryMuscle;
    if (!acc[muscle]) acc[muscle] = [];
    acc[muscle].push(ex);
    return acc;
  }, {} as Record<string, typeof filteredExercises>);

  // Get exercises from context
  const workoutExercises = activeWorkout?.exercises || [];

  if (contextLoading || !initialized) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (isComplete) {
    const totalSets = workoutExercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
    return (
      <View style={styles.completeContainer}>
        <Text style={styles.completeTitle}>Workout Complete!</Text>
        <Text style={styles.completeTime}>Duration: {formatTime(elapsedSeconds)}</Text>
        <Text style={styles.completeStats}>
          {workoutExercises.length} exercises, {totalSets} sets
        </Text>
        <Pressable style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
        <Pressable onPress={handleCompleteWorkout}>
          <Text style={styles.finishText}>Finish</Text>
        </Pressable>
      </View>

      {restSeconds !== null && restSeconds > 0 && showRestOverlay && (
        <Pressable style={styles.restOverlay} onPress={() => setShowRestOverlay(false)}>
          <RNView style={styles.restCard}>
            <Text style={styles.restTitle}>Rest</Text>
            <Text style={styles.restTime}>{formatTime(restSeconds)}</Text>
            <Text style={styles.restTap}>Tap to dismiss</Text>
          </RNView>
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
              onRemoveExercise={() => handleRemoveExercise(exercise.id)}
              onAddSet={() => handleAddSet(exercise.id)}
              onRemoveSet={(setNumber) => handleRemoveSet(exercise.id, setNumber)}
              onCompleteSet={(setNumber, reps, weight) => handleCompleteSet(exercise.id, setNumber, reps, weight)}
            />
          ))}

          <Pressable style={styles.addExerciseButton} onPress={() => setShowExercisePicker(true)}>
            <Ionicons name="add" size={24} color="#007AFF" />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
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
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <Pressable onPress={() => { setShowExercisePicker(false); setSearchQuery(''); }}>
                <Ionicons name="close" size={28} color={iconColor} />
              </Pressable>
            </View>

            <TextInput
              style={[styles.searchInput, colorScheme === 'dark' ? styles.searchInputDark : styles.searchInputLight]}
              placeholder="Search exercises..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView style={styles.exerciseList} keyboardShouldPersistTaps="handled">
              {Object.entries(groupedExercises).map(([muscle, exercises]) => (
                <View key={muscle} style={styles.muscleGroup}>
                  <Text style={styles.muscleTitle}>{MUSCLE_LABELS[muscle] || muscle}</Text>
                  {exercises.map(ex => (
                    <Pressable
                      key={ex.id}
                      style={styles.exerciseItem}
                      onPress={() => handleAddExercise(ex)}
                    >
                      <Text style={styles.exerciseItemName}>{ex.name}</Text>
                      <Text style={styles.exerciseItemEquipment}>{EQUIPMENT_LABELS[ex.equipment]}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ExerciseCard({
  exercise,
  weightUnit,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  onCompleteSet,
}: {
  exercise: WorkoutExercise;
  weightUnit: WeightUnit;
  onRemoveExercise: () => void;
  onAddSet: () => void;
  onRemoveSet: (setNumber: number) => void;
  onCompleteSet: (setNumber: number, reps: number, weight: number) => void;
}) {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.exerciseEquipment}>{EQUIPMENT_LABELS[exercise.equipment]}</Text>
        </View>
        <Pressable onPress={onRemoveExercise} style={styles.removeButton}>
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </Pressable>
      </View>

      <View style={styles.setsContainer}>
        <View style={styles.setHeaderRow}>
          <Text style={styles.setHeaderText}>Set</Text>
          <Text style={styles.setHeaderText}>{weightUnit}</Text>
          <Text style={styles.setHeaderText}>Reps</Text>
          <Text style={styles.setHeaderText}></Text>
        </View>

        {exercise.sets.map(set => (
          <SetRow
            key={set.setNumber}
            set={set}
            weightUnit={weightUnit}
            onComplete={(reps, weight) => onCompleteSet(set.setNumber, reps, weight)}
            onRemove={() => onRemoveSet(set.setNumber)}
            colorScheme={colorScheme}
          />
        ))}

        <Pressable style={styles.addSetButton} onPress={onAddSet}>
          <Text style={styles.addSetText}>+ Add Set</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SetRow({
  set,
  weightUnit,
  onComplete,
  onRemove,
  colorScheme,
}: {
  set: SetData;
  weightUnit: WeightUnit;
  onComplete: (reps: number, weight: number) => void;
  onRemove: () => void;
  colorScheme: string | null | undefined;
}) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const inputStyle = colorScheme === 'dark' ? styles.inputDark : styles.inputLight;

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
        <Text style={styles.setNumber}>{set.setNumber}</Text>
        <Text style={styles.setWeight}>{set.weight !== null ? convertWeight(set.weight, weightUnit) : '-'}</Text>
        <Text style={styles.setReps}>{set.reps}</Text>
        <Text style={styles.checkmark}>✓</Text>
      </View>
    );
  }

  return (
    <View style={styles.setRow}>
      <Text style={styles.setNumber}>{set.setNumber}</Text>
      <TextInput
        style={[styles.input, inputStyle]}
        value={weight}
        onChangeText={setWeight}
        placeholder={weightUnit}
        keyboardType="decimal-pad"
        placeholderTextColor="#999"
      />
      <TextInput
        style={[styles.input, inputStyle]}
        value={reps}
        onChangeText={setReps}
        placeholder="Reps"
        keyboardType="number-pad"
        placeholderTextColor="#999"
      />
      <View style={styles.setActions}>
        <Pressable style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeButtonText}>✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  cancelText: { color: '#ff4444', fontSize: 16 },
  timer: { fontSize: 20, fontWeight: '600' },
  finishText: { color: '#4CAF50', fontSize: 16, fontWeight: '600' },
  scrollView: { flex: 1 },
  exerciseCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  exerciseInfo: { flex: 1, backgroundColor: 'transparent' },
  exerciseName: { fontSize: 18, fontWeight: '600' },
  exerciseEquipment: { fontSize: 14, opacity: 0.7 },
  removeButton: { padding: 8 },
  setsContainer: { marginTop: 12 },
  setHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  setHeaderText: { flex: 1, fontSize: 12, opacity: 0.5, textAlign: 'center' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  setNumber: { flex: 1, textAlign: 'center', fontWeight: '600' },
  setWeight: { flex: 1, textAlign: 'center' },
  setReps: { flex: 1, textAlign: 'center' },
  checkmark: { flex: 1, textAlign: 'center', color: '#4CAF50', fontSize: 18 },
  input: { flex: 1, marginHorizontal: 4, padding: 8, borderRadius: 8, textAlign: 'center' },
  inputLight: { backgroundColor: '#fff', color: '#000' },
  inputDark: { backgroundColor: '#333', color: '#fff' },
  setActions: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
  },
  completeButtonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  addSetButton: {
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addSetText: { color: '#007AFF', fontSize: 14, fontWeight: '500' },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    gap: 8,
  },
  addExerciseText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  bottomPadding: { height: 100 },
  // Modal styles
  modalContainer: { flex: 1, paddingTop: 60 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  modalTitle: { fontSize: 20, fontWeight: '600' },
  searchInput: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  searchInputLight: { backgroundColor: '#f0f0f0', color: '#000' },
  searchInputDark: { backgroundColor: '#333', color: '#fff' },
  exerciseList: { flex: 1 },
  muscleGroup: { marginBottom: 16 },
  muscleTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  exerciseItemName: { fontSize: 16 },
  exerciseItemEquipment: { fontSize: 14, opacity: 0.5 },
  // Complete screen
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeTitle: { fontSize: 32, fontWeight: 'bold' },
  completeTime: { fontSize: 18, opacity: 0.7, marginTop: 8 },
  completeStats: { fontSize: 16, opacity: 0.5, marginTop: 4 },
  doneButton: {
    marginTop: 40,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  doneButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  // Rest overlay
  restOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  restCard: {
    backgroundColor: '#333',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  restTitle: { fontSize: 24, fontWeight: '600', color: '#fff' },
  restTime: { fontSize: 64, fontWeight: 'bold', color: '#4CAF50', marginVertical: 20 },
  restTap: { fontSize: 14, color: '#999' },
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
});
