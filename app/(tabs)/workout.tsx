import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Text, View, useColors } from '@/components/Themed';
import { useWorkoutSplits, useWorkoutMutations, TemplateWithDetails, SplitWithTemplates } from '@/hooks/useWorkoutTemplates';
import { useWorkoutDashboard } from '@/hooks/useWorkoutDashboard';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, Button, SwipeableRow } from '@/components/ui';
import { QuickStatsCard, SuggestedWorkoutCard } from '@/components/dashboard';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius, Layout } from '@/constants/Spacing';
import { Shadows } from '@/constants/Shadows';
import * as Haptics from 'expo-haptics';

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
  const colors = useColors();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/workout/${template.id}`);
  };

  const dayBadge = template.dayOfWeek !== null ? DAY_ABBREVIATIONS[template.dayOfWeek] : null;

  return (
    <Card
      variant="filled"
      onPress={handlePress}
      style={styles.templateCard}
      padding="md"
    >
      <View style={[styles.templateContent, { backgroundColor: 'transparent' }]}>
        <View style={[styles.templateNameRow, { backgroundColor: 'transparent' }]}>
          {dayBadge && (
            <Badge label={dayBadge} variant="primary" size="sm" />
          )}
          <Text style={[styles.templateName, { color: colors.text }]} numberOfLines={1}>
            {template.name}
          </Text>
        </View>
        <Text style={[styles.templateMeta, { color: colors.textSecondary }]}>
          {template.exerciseCount} exercises
        </Text>
      </View>
      <Text style={[styles.templateLastDone, { color: colors.textTertiary }]}>
        {formatLastPerformed(template.lastPerformed)}
      </Text>
    </Card>
  );
}

function SplitContainer({
  split,
  onDeleteSplit,
  onDeleteTemplate
}: {
  split: SplitWithTemplates;
  onDeleteSplit: (id: string) => void;
  onDeleteTemplate: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const colors = useColors();

  const handleDeleteSplit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Split',
      `Are you sure you want to delete "${split.name}"? This will also delete all templates and exercises in this split.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteSplit(split.id) },
      ]
    );
  };

  const toggleExpanded = () => {
    Haptics.selectionAsync();
    setExpanded(!expanded);
  };

  return (
    <Card variant="outline" style={[styles.splitContainer, { borderColor: colors.separator }]} padding="none">
      <View style={[styles.splitHeader, { backgroundColor: 'transparent' }]}>
        <Pressable style={styles.splitTitlePressable} onPress={toggleExpanded}>
          <View style={[styles.splitTitleContainer, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.splitName, { color: colors.text }]}>{split.name}</Text>
            {split.description && (
              <Text style={[styles.splitDescription, { color: colors.textSecondary }]}>
                {split.description}
              </Text>
            )}
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textTertiary}
          />
        </Pressable>
        <Pressable onPress={handleDeleteSplit} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </Pressable>
      </View>

      {expanded && (
        <View style={[styles.templatesContainer, { backgroundColor: 'transparent' }]}>
          {split.templates.map(template => (
            <SwipeableRow
              key={template.id}
              onDelete={() => onDeleteTemplate(template.id)}
            >
              <TemplateCard template={template} />
            </SwipeableRow>
          ))}
        </View>
      )}
    </Card>
  );
}

export default function WorkoutScreen() {
  const router = useRouter();
  const colors = useColors();
  const { splits, standaloneTemplates, loading, error, refetch } = useWorkoutSplits();
  const { data: dashboardData, refetch: refetchDashboard } = useWorkoutDashboard();
  const { deleteWorkoutSplit, deleteWorkoutTemplate } = useWorkoutMutations();

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchDashboard();
    }, [refetch, refetchDashboard])
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

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteWorkoutTemplate(templateId);
      refetch();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete workout. Please try again.');
      console.error('Error deleting template:', e);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Error: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <View style={[styles.headerTop, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.title, { color: colors.text }]}>Workouts</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings');
            }}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select a workout to begin
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Card
          variant="outline"
          onPress={() => router.push('/workout/empty')}
          style={[styles.actionCard, { borderColor: colors.primary + '40' }]}
        >
          <View style={[styles.actionCardContent, { backgroundColor: 'transparent' }]}>
            <View style={[styles.actionIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            </View>
            <View style={[styles.actionTextContainer, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.actionTitle, { color: colors.primary }]}>
                Start Empty Workout
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                Track exercises freely
              </Text>
            </View>
          </View>
        </Card>

        <Card
          variant="outline"
          onPress={() => router.push('/workout/create-split')}
          style={[styles.actionCard, { borderColor: colors.success + '40' }]}
        >
          <View style={[styles.actionCardContent, { backgroundColor: 'transparent' }]}>
            <View style={[styles.actionIconContainer, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="fitness-outline" size={24} color={colors.success} />
            </View>
            <View style={[styles.actionTextContainer, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.actionTitle, { color: colors.success }]}>
                Create Workout Split
              </Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                Plan your training program
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Dashboard Section */}
      <View style={styles.dashboardSection}>
        <QuickStatsCard
          workoutCount={dashboardData.thisWeek.workoutCount}
          streak={dashboardData.thisWeek.streak}
          hasHistory={dashboardData.hasHistory}
          workoutDays={dashboardData.thisWeek.workoutDays}
        />

        {dashboardData.suggestedWorkout && (
          <SuggestedWorkoutCard
            template={dashboardData.suggestedWorkout.template}
            reason={dashboardData.suggestedWorkout.reason}
            workedOutToday={dashboardData.workedOutToday}
          />
        )}
      </View>

      {/* Workout Splits */}
      {splits.map(split => (
        <SplitContainer
          key={split.id}
          split={split}
          onDeleteSplit={handleDeleteSplit}
          onDeleteTemplate={handleDeleteTemplate}
        />
      ))}

      {/* Standalone Templates (if any) */}
      {standaloneTemplates.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            OTHER WORKOUTS
          </Text>
          {standaloneTemplates.map(template => (
            <SwipeableRow
              key={template.id}
              onDelete={() => handleDeleteTemplate(template.id)}
            >
              <TemplateCard template={template} />
            </SwipeableRow>
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
  contentContainer: {
    paddingBottom: Spacing.xxxl,
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
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
  },
  header: {
    padding: Spacing.xl,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...Typography.largeTitle,
  },
  settingsButton: {
    padding: Spacing.xs,
  },
  subtitle: {
    ...Typography.subhead,
    marginTop: Spacing.xs,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  dashboardSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.footnote,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  actionCard: {
    marginBottom: Spacing.md,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextContainer: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  actionTitle: {
    ...Typography.headline,
  },
  actionSubtitle: {
    ...Typography.footnote,
    marginTop: 2,
  },
  splitContainer: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  splitTitlePressable: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitTitleContainer: {
    flex: 1,
  },
  deleteButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  splitName: {
    ...Typography.headline,
  },
  splitDescription: {
    ...Typography.footnote,
    marginTop: 2,
  },
  templatesContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  templateCard: {
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateContent: {
    flex: 1,
  },
  templateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  templateName: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
  },
  templateMeta: {
    ...Typography.footnote,
    marginTop: 2,
  },
  templateLastDone: {
    ...Typography.caption1,
  },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  templateDeleteButton: {
    padding: Spacing.xs,
  },
});
