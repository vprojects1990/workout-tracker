import { StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Text, View, useColors } from '@/components/Themed';
import { useWorkoutHistory, WorkoutHistoryItem, useWorkoutDetails, useHistoryMutations } from '@/hooks/useWorkoutHistory';
import { useWorkoutDashboard } from '@/hooks/useWorkoutDashboard';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSettings, convertWeight } from '@/hooks/useSettings';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, SwipeableRow } from '@/components/ui';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { haptics } from '@/utils/haptics';
import { EQUIPMENT_LABELS } from '@/constants/Labels';
import { formatRelativeDate, formatDuration } from '@/utils/dates';

function HistoryCard({
  item,
  weightUnit,
  expanded,
  onToggle,
}: {
  item: WorkoutHistoryItem;
  weightUnit: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();
  const { details, loading } = useWorkoutDetails(expanded ? item.id : null);

  const handleToggle = () => {
    haptics.selection();
    onToggle();
  };

  return (
    <Card variant="default" style={styles.historyCard} padding="none">
      <Pressable style={styles.cardHeader} onPress={handleToggle}>
        <View style={[styles.headerLeft, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.templateName, { color: colors.text }]}>
            {item.templateName}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatRelativeDate(item.completedAt)}
          </Text>
        </View>
        <View style={[styles.headerRight, { backgroundColor: 'transparent' }]}>
          <Badge
            label={formatDuration(item.durationSeconds)}
            variant="default"
            size="sm"
          />
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textTertiary}
          />
        </View>
      </Pressable>

      {!expanded && (
        <View style={[styles.cardSummary, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.summaryText, { color: colors.textTertiary }]}>
            {item.exerciseCount} exercises · {item.totalSets} sets
          </Text>
        </View>
      )}

      {expanded && (
        <View style={[styles.cardDetails, { borderTopColor: colors.separator, backgroundColor: 'transparent' }]}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
          ) : (
            details.map(exercise => (
              <View key={exercise.exerciseId} style={[styles.exerciseRow, { backgroundColor: 'transparent' }]}>
                <View style={[styles.exerciseNameContainer, { backgroundColor: 'transparent' }]}>
                  <Text style={[styles.exerciseSets, { color: colors.textTertiary }]}>
                    {exercise.sets.length}x
                  </Text>
                  <View style={[styles.exerciseNameColumn, { backgroundColor: 'transparent' }]}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {exercise.name}
                    </Text>
                    <Text style={[styles.exerciseEquipment, { color: colors.textTertiary }]}>
                      {EQUIPMENT_LABELS[exercise.equipment]}
                    </Text>
                  </View>
                </View>
                <View style={[styles.exerciseWeightContainer, { backgroundColor: 'transparent' }]}>
                  <Text style={[styles.exerciseWeight, { color: colors.text }]}>
                    {convertWeight(exercise.maxWeight, weightUnit as 'kg' | 'lbs')} {weightUnit}
                  </Text>
                  {exercise.isPR && (
                    <Badge label="PR" variant="warning" size="sm" />
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </Card>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const { history, loading, error, refetch } = useWorkoutHistory();
  const { deleteWorkoutSession } = useHistoryMutations();
  const { refetch: refetchDashboard } = useWorkoutDashboard();
  const { settings } = useSettings();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  }, []);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      await deleteWorkoutSession(sessionId);
      refetch();
      refetchDashboard();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete workout. Please try again.');
      if (__DEV__) console.error('Error deleting session:', e);
    }
  }, [deleteWorkoutSession, refetch, refetchDashboard]);

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

  const renderHistoryItem = useCallback(({ item }: { item: WorkoutHistoryItem }) => (
    <SwipeableRow onDelete={() => handleDeleteSession(item.id)}>
      <HistoryCard
        item={item}
        weightUnit={settings.weightUnit}
        expanded={expandedId === item.id}
        onToggle={() => toggleExpanded(item.id)}
      />
    </SwipeableRow>
  ), [expandedId, settings.weightUnit, handleDeleteSession, toggleExpanded]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlashList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={item => item.id}
        extraData={expandedId}
        contentContainerStyle={styles.listContentContainer}
        ListHeaderComponent={
          <View style={[styles.header, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.title, { color: colors.text }]}>History</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Your past workouts
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No workouts yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Complete a workout to see it here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContentContainer: {
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
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
  title: {
    ...Typography.largeTitle,
  },
  subtitle: {
    ...Typography.subhead,
    marginTop: Spacing.xs,
  },
  emptyState: {
    padding: Spacing.section,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.headline,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    ...Typography.subhead,
    marginTop: Spacing.sm,
  },
  historyCard: {
    // No marginBottom - SwipeableRow handles spacing
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  templateName: {
    ...Typography.headline,
  },
  date: {
    ...Typography.footnote,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardSummary: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  summaryText: {
    ...Typography.footnote,
  },
  cardDetails: {
    borderTopWidth: 1,
    padding: Spacing.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  exerciseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  exerciseSets: {
    ...Typography.subhead,
    fontWeight: '600',
    width: 24,
  },
  exerciseNameColumn: {
    flex: 1,
  },
  exerciseName: {
    ...Typography.subhead,
    fontWeight: '500',
  },
  exerciseEquipment: {
    ...Typography.caption2,
  },
  exerciseWeightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  exerciseWeight: {
    ...Typography.subhead,
    fontWeight: '600',
  },
});
