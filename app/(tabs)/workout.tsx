import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useWorkoutSplits, useWorkoutMutations, TemplateWithDetails, SplitWithTemplates } from '@/hooks/useWorkoutTemplates';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';

function formatLastPerformed(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

const DAY_ABBREVIATIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function TemplateCard({ template }: { template: TemplateWithDetails }) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/workout/${template.id}`);
  };

  const dayBadge = template.dayOfWeek !== null ? DAY_ABBREVIATIONS[template.dayOfWeek] : null;

  return (
    <Pressable style={styles.templateCard} onPress={handlePress}>
      <View style={styles.templateContent}>
        <View style={styles.templateNameRow}>
          {dayBadge && (
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>{dayBadge}</Text>
            </View>
          )}
          <Text style={styles.templateName}>{template.name}</Text>
        </View>
        <Text style={styles.templateMeta}>{template.exerciseCount} exercises</Text>
      </View>
      <Text style={styles.templateLastDone}>Last: {formatLastPerformed(template.lastPerformed)}</Text>
    </Pressable>
  );
}

function SplitContainer({ split, onDelete }: { split: SplitWithTemplates; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';

  const handleDelete = () => {
    Alert.alert(
      'Delete Split',
      `Are you sure you want to delete "${split.name}"? This will also delete all templates and exercises in this split.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(split.id) },
      ]
    );
  };

  return (
    <View style={styles.splitContainer}>
      <View style={styles.splitHeader}>
        <Pressable style={styles.splitTitlePressable} onPress={() => setExpanded(!expanded)}>
          <View style={styles.splitTitleContainer}>
            <Text style={styles.splitName}>{split.name}</Text>
            {split.description && (
              <Text style={styles.splitDescription}>{split.description}</Text>
            )}
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={iconColor}
          />
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </Pressable>
      </View>

      {expanded && (
        <View style={styles.templatesContainer}>
          {split.templates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function WorkoutScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';
  const { splits, standaloneTemplates, loading, error, refetch } = useWorkoutSplits();
  const { deleteWorkoutSplit } = useWorkoutMutations();

  // Refetch data when screen comes into focus (e.g., after creating a new split)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleDeleteSplit = async (splitId: string) => {
    try {
      await deleteWorkoutSplit(splitId);
      refetch();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete split. Please try again.');
      console.error('Error deleting split:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Workouts</Text>
          <Pressable onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={iconColor} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Select a workout to begin</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Pressable
          style={styles.emptyWorkoutButton}
          onPress={() => router.push('/workout/empty')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.emptyWorkoutText}>Start Empty Workout</Text>
        </Pressable>
        <Pressable
          style={styles.createSplitButton}
          onPress={() => router.push('/workout/create-split')}
        >
          <Ionicons name="fitness-outline" size={24} color="#34C759" />
          <Text style={styles.createSplitText}>Create Workout Split</Text>
        </Pressable>
      </View>

      {/* Workout Splits */}
      {splits.map(split => (
        <SplitContainer key={split.id} split={split} onDelete={handleDeleteSplit} />
      ))}

      {/* Standalone Templates (if any) */}
      {standaloneTemplates.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Workouts</Text>
          {standaloneTemplates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </View>
      )}
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  emptyWorkoutText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createSplitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 12,
  },
  createSplitText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '600',
  },
  splitContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingRight: 8,
    backgroundColor: 'transparent',
  },
  splitTitlePressable: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  splitTitleContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  splitName: {
    fontSize: 18,
    fontWeight: '600',
  },
  splitDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  templatesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  templateCard: {
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateContent: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  templateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  dayBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dayBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  templateMeta: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  templateLastDone: {
    fontSize: 12,
    opacity: 0.5,
  },
});
