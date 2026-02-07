import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, View, useColors } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useWorkoutMutations } from '@/hooks/useWorkoutTemplates';

import { Ionicons } from '@expo/vector-icons';
import { StepIndicator } from '@/components/wizard/StepIndicator';
import { DayPicker, WorkoutDay } from '@/components/wizard/DayPicker';
import * as Haptics from 'expo-haptics';
import { Card, Button, Badge } from '@/components/ui';
import { ExercisePickerModal, EQUIPMENT_LABELS } from '@/components/workout';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';

type Exercise = {
  id: string;
  exerciseId: string;
  name: string;
  equipment: string;
};

const WIZARD_STEPS = ['Details', 'Days', 'Exercises'];

export default function CreateSplitScreen() {
  const router = useRouter();
  const colors = useColors();

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
  const addExercise = (exercise: { id: string; name: string; equipment: string; primaryMuscle: string }) => {
    if (!selectedDayId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newExercise: Exercise = {
      id: `exercise-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      exerciseId: exercise.id,
      name: exercise.name,
      equipment: exercise.equipment,
    };

    const currentExercises = dayExercises.get(selectedDayId) || [];
    setDayExercises(new Map(dayExercises).set(selectedDayId, [...currentExercises, newExercise]));
    setShowExercisePicker(false);
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

  // Save the full split
  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('Error', 'Each workout day must have at least one exercise');
      return;
    }

    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const exerciseInputMap = new Map<string, Array<{ exerciseId: string }>>();

      dayExercises.forEach((exercises, dayId) => {
        exerciseInputMap.set(
          dayId,
          exercises.map(e => ({ exerciseId: e.exerciseId }))
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
      if (__DEV__) console.error('Error saving split:', error);
    } finally {
      setSaving(false);
    }
  };

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
      <ExercisePickerModal
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelect={addExercise}
      />
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
});
