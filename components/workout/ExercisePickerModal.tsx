import { useState, useMemo, useCallback } from 'react';
import { StyleSheet, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text, View, useColors } from '@/components/Themed';
import { useAllExercises } from '@/hooks/useWorkoutTemplates';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { EQUIPMENT_LABELS } from '@/constants/Labels';

export { EQUIPMENT_LABELS } from '@/constants/Labels';

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

type SectionHeader = { type: 'header'; muscle: string };
type ExerciseItem = { type: 'exercise'; id: string; name: string; equipment: string; primaryMuscle: string };
type ListItem = SectionHeader | ExerciseItem;

type ExercisePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: { id: string; name: string; equipment: string; primaryMuscle: string }) => void;
};

export function ExercisePickerModal({ visible, onClose, onSelect }: ExercisePickerModalProps) {
  const colors = useColors();
  const { exercises: allExercises, loading } = useAllExercises();
  const [searchQuery, setSearchQuery] = useState('');

  const listData = useMemo<ListItem[]>(() => {
    const filtered = allExercises.filter(ex =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped = filtered.reduce((acc, ex) => {
      const muscle = ex.primaryMuscle;
      if (!acc[muscle]) acc[muscle] = [];
      acc[muscle].push(ex);
      return acc;
    }, {} as Record<string, typeof filtered>);

    const items: ListItem[] = [];
    for (const [muscle, exercises] of Object.entries(grouped)) {
      items.push({ type: 'header', muscle });
      for (const ex of exercises) {
        items.push({ type: 'exercise', ...ex });
      }
    }
    return items;
  }, [allExercises, searchQuery]);

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleSelect = useCallback((exercise: { id: string; name: string; equipment: string; primaryMuscle: string }) => {
    setSearchQuery('');
    onSelect(exercise);
  }, [onSelect]);

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={[styles.muscleTitle, { color: colors.textTertiary }]}>
            {MUSCLE_LABELS[item.muscle] || item.muscle}
          </Text>
        </View>
      );
    }
    return (
      <Pressable
        style={[styles.exerciseItem, { borderBottomColor: colors.separator }]}
        onPress={() => handleSelect(item)}
      >
        <Text style={[styles.exerciseItemName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.exerciseItemEquipment, { color: colors.textTertiary }]}>
          {EQUIPMENT_LABELS[item.equipment] || item.equipment}
        </Text>
      </Pressable>
    );
  }, [colors, handleSelect]);

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

          {loading ? (
            <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading exercises...</Text>
          ) : (
            <FlashList
              data={listData}
              renderItem={renderItem}
              getItemType={item => item.type}
              keyExtractor={item => item.type === 'header' ? `header-${item.muscle}` : item.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
                  No exercises found
                </Text>
              }
            />
          )}
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
  loadingText: {
    textAlign: 'center',
    padding: Spacing.xl,
    ...Typography.body,
  },
  sectionHeader: {},
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
