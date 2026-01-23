import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useAllExercises, useWorkoutMutations } from '@/hooks/useWorkoutTemplates';
import { useColorScheme } from '@/components/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { StepIndicator } from '@/components/wizard/StepIndicator';
import { DayPicker, WorkoutDay } from '@/components/wizard/DayPicker';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
};

type Exercise = {
  id: string;
  exerciseId: string;
  name: string;
  equipment: string;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
};

const WIZARD_STEPS = ['Details', 'Days', 'Exercises'];

export default function CreateSplitScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';
  const inputStyle = colorScheme === 'dark' ? styles.inputDark : styles.inputLight;

  const { exercises: allExercises, loading: exercisesLoading } = useAllExercises();
  const { createFullSplit } = useWorkoutMutations();

  // Step tracking
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Split details
  const [splitName, setSplitName] = useState('');
  const [splitDescription, setSplitDescription] = useState('');

  // Step 2: Workout days
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);

  // Step 3: Exercises per day
  const [dayExercises, setDayExercises] = useState<Map<string, Exercise[]>>(new Map());
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [saving, setSaving] = useState(false);

  // Navigation validation
  const canGoToStep2 = splitName.trim().length > 0;
  const canGoToStep3 = workoutDays.length > 0;
  const canSave = workoutDays.every(day => {
    const exercises = dayExercises.get(day.id) || [];
    return exercises.length > 0;
  });

  // Day management
  const handleAddDay = (day: WorkoutDay) => {
    setWorkoutDays([...workoutDays, day]);
    // Initialize empty exercise list for this day
    setDayExercises(new Map(dayExercises).set(day.id, []));
  };

  const handleRemoveDay = (dayId: string) => {
    setWorkoutDays(workoutDays.filter(d => d.id !== dayId));
    const newMap = new Map(dayExercises);
    newMap.delete(dayId);
    setDayExercises(newMap);
    if (selectedDayId === dayId) {
      setSelectedDayId(null);
    }
  };

  // Exercise management for selected day
  const addExercise = (exercise: { id: string; name: string; equipment: string }) => {
    if (!selectedDayId) return;

    const newExercise: Exercise = {
      id: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: exercise.id,
      name: exercise.name,
      equipment: exercise.equipment,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12,
    };

    const currentExercises = dayExercises.get(selectedDayId) || [];
    setDayExercises(new Map(dayExercises).set(selectedDayId, [...currentExercises, newExercise]));
    setShowExercisePicker(false);
    setSearchQuery('');
  };

  const removeExercise = (exerciseId: string) => {
    if (!selectedDayId) return;

    const currentExercises = dayExercises.get(selectedDayId) || [];
    setDayExercises(
      new Map(dayExercises).set(
        selectedDayId,
        currentExercises.filter(e => e.id !== exerciseId)
      )
    );
  };

  const updateExercise = (
    exerciseId: string,
    field: 'targetSets' | 'targetRepMin' | 'targetRepMax',
    value: number
  ) => {
    if (!selectedDayId) return;

    const currentExercises = dayExercises.get(selectedDayId) || [];
    setDayExercises(
      new Map(dayExercises).set(
        selectedDayId,
        currentExercises.map(e => (e.id === exerciseId ? { ...e, [field]: value } : e))
      )
    );
  };

  // Save the full split
  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('Error', 'Each workout day must have at least one exercise');
      return;
    }

    setSaving(true);

    try {
      // Convert Exercise[] to ExerciseInput[] format expected by createFullSplit
      const exerciseInputMap = new Map<string, Array<{
        exerciseId: string;
        targetSets: number;
        targetRepMin: number;
        targetRepMax: number;
      }>>();

      dayExercises.forEach((exercises, dayId) => {
        exerciseInputMap.set(
          dayId,
          exercises.map(e => ({
            exerciseId: e.exerciseId,
            targetSets: e.targetSets,
            targetRepMin: e.targetRepMin,
            targetRepMax: e.targetRepMax,
          }))
        );
      });

      await createFullSplit(
        splitName.trim(),
        splitDescription.trim() || undefined,
        workoutDays,
        exerciseInputMap
      );

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save split. Please try again.');
      console.error('Error saving split:', error);
    } finally {
      setSaving(false);
    }
  };

  // Filter and group exercises for picker
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

  // Get exercises for selected day
  const selectedDayExercises = selectedDayId ? dayExercises.get(selectedDayId) || [] : [];
  const selectedDay = workoutDays.find(d => d.id === selectedDayId);

  // Auto-select first day when entering step 3
  const handleGoToStep3 = () => {
    if (workoutDays.length > 0 && !selectedDayId) {
      // Sort by dayOfWeek and select first
      const sorted = [...workoutDays].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      setSelectedDayId(sorted[0].id);
    }
    setCurrentStep(3);
  };

  // Header buttons based on step
  const renderHeaderButtons = () => {
    if (currentStep === 1) {
      return (
        <>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => setCurrentStep(2)}
            style={styles.headerButton}
            disabled={!canGoToStep2}
          >
            <Text style={[styles.nextText, !canGoToStep2 && styles.nextTextDisabled]}>
              Next
            </Text>
          </Pressable>
        </>
      );
    } else if (currentStep === 2) {
      return (
        <>
          <Pressable onPress={() => setCurrentStep(1)} style={styles.headerButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable
            onPress={handleGoToStep3}
            style={styles.headerButton}
            disabled={!canGoToStep3}
          >
            <Text style={[styles.nextText, !canGoToStep3 && styles.nextTextDisabled]}>
              Next
            </Text>
          </Pressable>
        </>
      );
    } else {
      return (
        <>
          <Pressable onPress={() => setCurrentStep(2)} style={styles.headerButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={styles.headerButton}
            disabled={saving || !canSave}
          >
            <Text style={[styles.saveText, (saving || !canSave) && styles.saveTextDisabled]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </>
      );
    }
  };

  // Render step content
  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <>
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Split Name *</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              value={splitName}
              onChangeText={setSplitName}
              placeholder="e.g., Push/Pull/Legs"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.input, inputStyle]}
              value={splitDescription}
              onChangeText={setSplitDescription}
              placeholder="e.g., 3-day split for strength"
              placeholderTextColor="#999"
            />
          </View>
        </>
      );
    } else if (currentStep === 2) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Workout Days</Text>
          <Text style={styles.sectionSubtitle}>
            Tap a day to add it to your split
          </Text>
          <DayPicker
            workoutDays={workoutDays}
            onAddDay={handleAddDay}
            onRemoveDay={handleRemoveDay}
          />
        </View>
      );
    } else {
      // Sort workout days by dayOfWeek for tab display
      const sortedDays = [...workoutDays].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

      return (
        <>
          {/* Day selector tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.dayTabsContainer}
            contentContainerStyle={styles.dayTabsContent}
          >
            {sortedDays.map(day => {
              const isSelected = day.id === selectedDayId;
              const exerciseCount = (dayExercises.get(day.id) || []).length;
              const hasExercises = exerciseCount > 0;

              return (
                <Pressable
                  key={day.id}
                  style={[styles.dayTab, isSelected && styles.dayTabSelected]}
                  onPress={() => setSelectedDayId(day.id)}
                >
                  <Text style={[styles.dayTabText, isSelected && styles.dayTabTextSelected]}>
                    {day.displayName}
                  </Text>
                  <Text
                    style={[
                      styles.dayTabCount,
                      isSelected && styles.dayTabCountSelected,
                      !hasExercises && styles.dayTabCountEmpty,
                    ]}
                  >
                    {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Exercise list for selected day */}
          {selectedDay && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{selectedDay.displayName}</Text>

              {selectedDayExercises.map(exercise => (
                <View key={exercise.id} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Pressable
                      onPress={() => removeExercise(exercise.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="remove-circle" size={24} color="#ff4444" />
                    </Pressable>
                  </View>
                  <View style={styles.setsRepsRow}>
                    <TextInput
                      style={[styles.smallInput, inputStyle]}
                      value={exercise.targetSets.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        if (!isNaN(num) && num > 0) {
                          updateExercise(exercise.id, 'targetSets', num);
                        }
                      }}
                      keyboardType="number-pad"
                      placeholder="Sets"
                      placeholderTextColor="#999"
                    />
                    <Text style={styles.setsRepsLabel}>sets ×</Text>
                    <TextInput
                      style={[styles.smallInput, inputStyle]}
                      value={exercise.targetRepMin.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        if (!isNaN(num) && num > 0) {
                          updateExercise(exercise.id, 'targetRepMin', num);
                        }
                      }}
                      keyboardType="number-pad"
                      placeholder="Min"
                      placeholderTextColor="#999"
                    />
                    <Text style={styles.setsRepsLabel}>-</Text>
                    <TextInput
                      style={[styles.smallInput, inputStyle]}
                      value={exercise.targetRepMax.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        if (!isNaN(num) && num > 0) {
                          updateExercise(exercise.id, 'targetRepMax', num);
                        }
                      }}
                      keyboardType="number-pad"
                      placeholder="Max"
                      placeholderTextColor="#999"
                    />
                    <Text style={styles.setsRepsLabel}>reps</Text>
                  </View>
                </View>
              ))}

              <Pressable
                style={styles.addExerciseButton}
                onPress={() => setShowExercisePicker(true)}
              >
                <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                <Text style={styles.addExerciseText}>Add Exercise</Text>
              </Pressable>
            </View>
          )}
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {renderHeaderButtons()}
      </View>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} steps={WIZARD_STEPS} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {renderStepContent()}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Exercise Picker Modal */}
      <Modal visible={showExercisePicker} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <Pressable onPress={() => { setShowExercisePicker(false); setSearchQuery(''); }}>
                <Ionicons name="close" size={28} color={iconColor} />
              </Pressable>
            </View>

            <TextInput
              style={[styles.searchInput, inputStyle]}
              placeholder="Search exercises..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView style={styles.exerciseList} keyboardShouldPersistTaps="handled">
              {exercisesLoading ? (
                <Text style={styles.loadingText}>Loading exercises...</Text>
              ) : (
                Object.entries(groupedExercises).map(([muscle, muscleExercises]) => (
                  <View key={muscle} style={styles.muscleGroup}>
                    <Text style={styles.muscleTitle}>{MUSCLE_LABELS[muscle] || muscle}</Text>
                    {muscleExercises.map(ex => (
                      <Pressable
                        key={ex.id}
                        style={styles.exerciseItem}
                        onPress={() => addExercise(ex)}
                      >
                        <Text style={styles.exerciseItemName}>{ex.name}</Text>
                        <Text style={styles.exerciseItemEquipment}>
                          {EQUIPMENT_LABELS[ex.equipment] || ex.equipment}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  headerButton: {
    padding: 4,
  },
  cancelText: {
    color: '#ff4444',
    fontSize: 16,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
  },
  nextText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextTextDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  inputLight: {
    backgroundColor: '#f0f0f0',
    color: '#000',
  },
  inputDark: {
    backgroundColor: '#333',
    color: '#fff',
  },
  // Day tabs for step 3
  dayTabsContainer: {
    maxHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  dayTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    marginRight: 10,
  },
  dayTabSelected: {
    backgroundColor: '#007AFF',
  },
  dayTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayTabTextSelected: {
    color: '#fff',
  },
  dayTabCount: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  dayTabCountSelected: {
    color: '#fff',
    opacity: 0.8,
  },
  dayTabCountEmpty: {
    color: '#ff4444',
    opacity: 1,
  },
  // Exercise card styles
  exerciseCard: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  setsRepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  smallInput: {
    width: 48,
    padding: 8,
    borderRadius: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  setsRepsLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 4,
  },
  addExerciseText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  exerciseList: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    opacity: 0.5,
  },
  muscleGroup: {
    marginBottom: 16,
  },
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
  exerciseItemName: {
    fontSize: 16,
  },
  exerciseItemEquipment: {
    fontSize: 14,
    opacity: 0.5,
  },
});
