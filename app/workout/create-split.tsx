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
import { Text, View, useColors } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useAllExercises, useWorkoutMutations } from '@/hooks/useWorkoutTemplates';
import { Ionicons } from '@expo/vector-icons';
import { StepIndicator } from '@/components/wizard/StepIndicator';
import { DayPicker, WorkoutDay } from '@/components/wizard/DayPicker';
import * as Haptics from 'expo-haptics';
import { Card, Button, Badge } from '@/components/ui';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';

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
  const colors = useColors();

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWorkoutDays([...workoutDays, day]);
    setDayExercises(new Map(dayExercises).set(day.id, []));
  };

  const handleRemoveDay = (dayId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
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
    Haptics.selectionAsync();
    if (workoutDays.length > 0 && !selectedDayId) {
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
            <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setCurrentStep(2);
            }}
            style={styles.headerButton}
            disabled={!canGoToStep2}
          >
            <Text style={[styles.nextText, { color: colors.primary }, !canGoToStep2 && styles.textDisabled]}>
              Next
            </Text>
          </Pressable>
        </>
      );
    } else if (currentStep === 2) {
      return (
        <>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setCurrentStep(1);
            }}
            style={styles.headerButton}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
          </Pressable>
          <Pressable
            onPress={handleGoToStep3}
            style={styles.headerButton}
            disabled={!canGoToStep3}
          >
            <Text style={[styles.nextText, { color: colors.primary }, !canGoToStep3 && styles.textDisabled]}>
              Next
            </Text>
          </Pressable>
        </>
      );
    } else {
      return (
        <>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setCurrentStep(2);
            }}
            style={styles.headerButton}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={styles.headerButton}
            disabled={saving || !canSave}
          >
            <Text style={[styles.saveText, { color: colors.success }, (saving || !canSave) && styles.textDisabled]}>
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
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Split Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
              value={splitName}
              onChangeText={setSplitName}
              placeholder="e.g., Push/Pull/Legs"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
              value={splitDescription}
              onChangeText={setSplitDescription}
              placeholder="e.g., 3-day split for strength"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </>
      );
    } else if (currentStep === 2) {
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Workout Days</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
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
      const sortedDays = [...workoutDays].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

      return (
        <>
          {/* Day selector tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.dayTabsContainer, { borderBottomColor: colors.separator }]}
            contentContainerStyle={styles.dayTabsContent}
          >
            {sortedDays.map(day => {
              const isSelected = day.id === selectedDayId;
              const exerciseCount = (dayExercises.get(day.id) || []).length;
              const hasExercises = exerciseCount > 0;

              return (
                <Pressable
                  key={day.id}
                  style={[
                    styles.dayTab,
                    { backgroundColor: isSelected ? colors.primary : colors.backgroundSecondary }
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedDayId(day.id);
                  }}
                >
                  <Text style={[styles.dayTabText, { color: isSelected ? '#fff' : colors.text }]}>
                    {day.displayName}
                  </Text>
                  <Text
                    style={[
                      styles.dayTabCount,
                      { color: isSelected ? 'rgba(255,255,255,0.8)' : (hasExercises ? colors.textTertiary : colors.error) }
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
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{selectedDay.displayName}</Text>

              {selectedDayExercises.map(exercise => (
                <Card key={exercise.id} variant="filled" style={styles.exerciseCard} padding="md">
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseNameContainer}>
                      <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
                      <Text style={[styles.exerciseEquipment, { color: colors.textTertiary }]}>
                        {EQUIPMENT_LABELS[exercise.equipment]}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => removeExercise(exercise.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                  <View style={styles.setsRepsRow}>
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
                      value={exercise.targetSets.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        if (!isNaN(num) && num > 0) {
                          updateExercise(exercise.id, 'targetSets', num);
                        }
                      }}
                      keyboardType="number-pad"
                      placeholder="Sets"
                      placeholderTextColor={colors.textTertiary}
                    />
                    <Text style={[styles.setsRepsLabel, { color: colors.textSecondary }]}>sets ×</Text>
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
                      value={exercise.targetRepMin.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        if (!isNaN(num) && num > 0) {
                          updateExercise(exercise.id, 'targetRepMin', num);
                        }
                      }}
                      keyboardType="number-pad"
                      placeholder="Min"
                      placeholderTextColor={colors.textTertiary}
                    />
                    <Text style={[styles.setsRepsLabel, { color: colors.textSecondary }]}>-</Text>
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
                      value={exercise.targetRepMax.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        if (!isNaN(num) && num > 0) {
                          updateExercise(exercise.id, 'targetRepMax', num);
                        }
                      }}
                      keyboardType="number-pad"
                      placeholder="Max"
                      placeholderTextColor={colors.textTertiary}
                    />
                    <Text style={[styles.setsRepsLabel, { color: colors.textSecondary }]}>reps</Text>
                  </View>
                </Card>
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
            </View>
          )}
        </>
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
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
              {exercisesLoading ? (
                <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading exercises...</Text>
              ) : (
                Object.entries(groupedExercises).map(([muscle, muscleExercises]) => (
                  <View key={muscle} style={styles.muscleGroup}>
                    <Text style={[styles.muscleTitle, { color: colors.textTertiary }]}>
                      {MUSCLE_LABELS[muscle] || muscle}
                    </Text>
                    {muscleExercises.map(ex => (
                      <Pressable
                        key={ex.id}
                        style={[styles.exerciseItem, { borderBottomColor: colors.separator }]}
                        onPress={() => addExercise(ex)}
                      >
                        <Text style={[styles.exerciseItemName, { color: colors.text }]}>{ex.name}</Text>
                        <Text style={[styles.exerciseItemEquipment, { color: colors.textTertiary }]}>
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
    padding: Spacing.lg,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  cancelText: {
    ...Typography.body,
  },
  backText: {
    ...Typography.body,
  },
  nextText: {
    ...Typography.body,
    fontWeight: '600',
  },
  saveText: {
    ...Typography.body,
    fontWeight: '600',
  },
  textDisabled: {
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: Spacing.xl,
    paddingBottom: 0,
  },
  sectionTitle: {
    ...Typography.title3,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    ...Typography.subhead,
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.subhead,
    marginBottom: Spacing.sm,
  },
  input: {
    padding: Spacing.md,
    borderRadius: Radius.medium,
    ...Typography.body,
  },
  // Day tabs for step 3
  dayTabsContainer: {
    maxHeight: 80,
    borderBottomWidth: 1,
  },
  dayTabsContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dayTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.medium,
    marginRight: Spacing.sm,
  },
  dayTabText: {
    ...Typography.subhead,
    fontWeight: '600',
  },
  dayTabCount: {
    ...Typography.caption2,
    marginTop: 2,
  },
  // Exercise card styles
  exerciseCard: {
    marginBottom: Spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  exerciseNameContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  exerciseName: {
    ...Typography.headline,
  },
  exerciseEquipment: {
    ...Typography.footnote,
    marginTop: 2,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  setsRepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'transparent',
  },
  smallInput: {
    width: 48,
    padding: Spacing.sm,
    borderRadius: Radius.medium,
    ...Typography.body,
    textAlign: 'center',
  },
  setsRepsLabel: {
    ...Typography.subhead,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  addExerciseText: {
    ...Typography.headline,
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
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.title2,
  },
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
  exerciseList: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    padding: Spacing.xl,
    ...Typography.body,
  },
  muscleGroup: {
    marginBottom: Spacing.lg,
  },
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
  exerciseItemName: {
    ...Typography.body,
  },
  exerciseItemEquipment: {
    ...Typography.footnote,
  },
});
