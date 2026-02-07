import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Text, View, useColors } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTemplateExercises, useWorkoutMutations } from '@/hooks/useWorkoutTemplates';
import { db } from '@/db';
import { workoutTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Card, Badge } from '@/components/ui';
import { ExercisePickerModal, EQUIPMENT_LABELS } from '@/components/workout';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';

type EditableExercise = {
  exerciseId: string;
  name: string;
  equipment: string;
  primaryMuscle: string;
};

export default function EditTemplateScreen() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const router = useRouter();
  const colors = useColors();

  const { exercises: loadedExercises, loading } = useTemplateExercises(templateId || null);
  const { replaceTemplateExercises } = useWorkoutMutations();

  const [templateName, setTemplateName] = useState('');
  const [editedExercises, setEditedExercises] = useState<EditableExercise[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Fetch template name
  useEffect(() => {
    if (!templateId) return;
    (async () => {
      const result = await db
        .select({ name: workoutTemplates.name })
        .from(workoutTemplates)
        .where(eq(workoutTemplates.id, templateId))
        .limit(1);
      if (result.length > 0) {
        setTemplateName(result[0].name);
      }
    })();
  }, [templateId]);

  // Initialize local state from loaded data (once)
  useEffect(() => {
    if (!loading && loadedExercises.length >= 0 && !initialized) {
      setEditedExercises(
        loadedExercises.map(ex => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          equipment: ex.equipment,
          primaryMuscle: ex.primaryMuscle,
        }))
      );
      setInitialized(true);
    }
  }, [loading, loadedExercises, initialized]);

  const handleAddExercise = (exercise: { id: string; name: string; equipment: string; primaryMuscle: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditedExercises([...editedExercises, {
      exerciseId: exercise.id,
      name: exercise.name,
      equipment: exercise.equipment,
      primaryMuscle: exercise.primaryMuscle,
    }]);
    setIsDirty(true);
    setShowPicker(false);
  };

  const handleRemoveExercise = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditedExercises(editedExercises.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    Haptics.selectionAsync();
    const updated = [...editedExercises];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setEditedExercises(updated);
    setIsDirty(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === editedExercises.length - 1) return;
    Haptics.selectionAsync();
    const updated = [...editedExercises];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setEditedExercises(updated);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!templateId) return;
    setSaving(true);
    try {
      await replaceTemplateExercises(
        templateId,
        editedExercises.map(ex => ({ exerciseId: ex.exerciseId }))
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
      if (__DEV__) console.error('Error saving template exercises:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  if (loading || !initialized) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Pressable onPress={handleCancel} style={styles.headerButton}>
          <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {templateName || 'Edit Workout'}
        </Text>
        <Pressable
          onPress={handleSave}
          style={styles.headerButton}
          disabled={saving}
        >
          <Text style={[styles.saveText, { color: colors.success }, saving && styles.textDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {editedExercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              No Exercises
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              Add exercises to this workout day
            </Text>
          </View>
        ) : (
          editedExercises.map((exercise, index) => (
            <Card key={`${exercise.exerciseId}-${index}`} variant="filled" style={styles.exerciseCard} padding="md">
              <View style={styles.exerciseRow}>
                <View style={styles.exerciseNumber}>
                  <Text style={[styles.numberText, { color: colors.textTertiary }]}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
                  <Text style={[styles.exerciseEquipment, { color: colors.textTertiary }]}>
                    {EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment}
                  </Text>
                </View>
                <View style={styles.exerciseActions}>
                  <Pressable
                    onPress={() => handleMoveUp(index)}
                    style={[styles.actionButton, index === 0 && styles.actionDisabled]}
                    disabled={index === 0}
                    hitSlop={6}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={20}
                      color={index === 0 ? colors.textTertiary + '40' : colors.textSecondary}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => handleMoveDown(index)}
                    style={[styles.actionButton, index === editedExercises.length - 1 && styles.actionDisabled]}
                    disabled={index === editedExercises.length - 1}
                    hitSlop={6}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={index === editedExercises.length - 1 ? colors.textTertiary + '40' : colors.textSecondary}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemoveExercise(index)}
                    style={styles.actionButton}
                    hitSlop={6}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            </Card>
          ))
        )}

        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary + '15' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowPicker(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Exercise</Text>
        </Pressable>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <ExercisePickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleAddExercise}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    minWidth: 70,
  },
  headerTitle: {
    ...Typography.headline,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  cancelText: {
    ...Typography.body,
  },
  saveText: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'right',
  },
  textDisabled: {
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.headline,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    ...Typography.subhead,
  },
  exerciseCard: {
    marginBottom: Spacing.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  exerciseNumber: {
    width: 28,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  numberText: {
    ...Typography.headline,
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
    backgroundColor: 'transparent',
  },
  exerciseName: {
    ...Typography.headline,
  },
  exerciseEquipment: {
    ...Typography.footnote,
    marginTop: 2,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'transparent',
  },
  actionButton: {
    padding: Spacing.xs,
  },
  actionDisabled: {
    opacity: 0.3,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  addButtonText: {
    ...Typography.headline,
  },
  bottomPadding: {
    height: 100,
  },
});
