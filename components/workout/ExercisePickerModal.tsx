import { useState } from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View, useColors } from '@/components/Themed';
import { useAllExercises } from '@/hooks/useWorkoutTemplates';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';

export const MUSCLE_LABELS: Record<string, string> = {
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

export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
};

type ExercisePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: { id: string; name: string; equipment: string; primaryMuscle: string }) => void;
};

export function ExercisePickerModal({ visible, onClose, onSelect }: ExercisePickerModalProps) {
  const colors = useColors();
  const { exercises: allExercises, loading } = useAllExercises();
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleSelect = (exercise: { id: string; name: string; equipment: string; primaryMuscle: string }) => {
    setSearchQuery('');
    onSelect(exercise);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.title, { color: colors.text }]}>Add Exercise</Text>
            <Pressable onPress={handleClose}>
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
            {loading ? (
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
                      onPress={() => handleSelect(ex)}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
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
