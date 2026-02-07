import { useState, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Pressable, Modal, FlatList } from 'react-native';
import { Text, View, useColors } from '@/components/Themed';
import { useProgressiveOverload, ExerciseProgress, ProgressStatus, SourceWorkout } from '@/hooks/useProgressiveOverload';
import { useFocusEffect } from 'expo-router';
import { useSettings, convertWeight } from '@/hooks/useSettings';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutSplits, TemplateWithDetails } from '@/hooks/useWorkoutTemplates';
import { db } from '@/db';
import { workoutSessions } from '@/db/schema';
import { desc, isNotNull } from 'drizzle-orm';
import { Card, Badge } from '@/components/ui';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { haptics } from '@/utils/haptics';
import { EQUIPMENT_LABELS } from '@/constants/Labels';

type FilterMode = 'all' | 'template' | 'session';

type RecentSession = {
  id: string;
  templateName: string;
  completedAt: Date;
};

function useRecentSessions(limit: number = 5) {
  const [sessions, setSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const result = await db
        .select({
          id: workoutSessions.id,
          templateName: workoutSessions.templateName,
          completedAt: workoutSessions.completedAt,
        })
        .from(workoutSessions)
        .where(isNotNull(workoutSessions.completedAt))
        .orderBy(desc(workoutSessions.completedAt))
        .limit(limit);

      setSessions(
        result
          .filter((s): s is { id: string; templateName: string; completedAt: Date } => s.completedAt !== null)
          .map(s => ({
            id: s.id,
            templateName: s.templateName,
            completedAt: s.completedAt,
          }))
      );
    } catch (e) {
      console.error('Failed to fetch recent sessions:', e);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, refetch: fetchSessions };
}

const STATUS_LABELS: Record<ProgressStatus, string> = {
  progressing: 'Progressing',
  maintaining: 'Maintaining',
  stalled: 'Stalled',
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

const MUSCLE_ORDER = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves', 'core'];

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSourceWorkouts(sourceWorkouts: SourceWorkout[]): string {
  if (sourceWorkouts.length === 0) return '';
  const uniqueTemplates = [...new Set(
    sourceWorkouts.map(sw => sw.templateName).filter((name): name is string => name !== null)
  )];
  const hasEmptyWorkouts = sourceWorkouts.some(sw => sw.templateName === null);
  const parts: string[] = [];

  if (uniqueTemplates.length > 0) {
    if (uniqueTemplates.length <= 2) {
      parts.push(uniqueTemplates.join(', '));
    } else {
      parts.push(`${uniqueTemplates.slice(0, 2).join(', ')} +${uniqueTemplates.length - 2} more`);
    }
  }

  if (hasEmptyWorkouts) {
    const emptyWorkouts = sourceWorkouts.filter(sw => sw.templateName === null);
    if (emptyWorkouts.length === 1) {
      parts.push(`Empty Workout (${formatShortDate(emptyWorkouts[0].date)})`);
    } else {
      parts.push(`${emptyWorkouts.length} Empty Workouts`);
    }
  }

  return parts.join(', ');
}

function ProgressBar({ progress, status }: { progress: ExerciseProgress; status: ProgressStatus }) {
  const colors = useColors();
  const sessionsAtWeight = progress.sessionsAtCurrentWeight;
  const percentage = Math.min(sessionsAtWeight / 3, 1) * 100;

  const getStatusColor = () => {
    switch (status) {
      case 'progressing': return colors.success;
      case 'maintaining': return colors.warning;
      case 'stalled': return colors.error;
    }
  };

  return (
    <View style={[styles.progressBarContainer, { backgroundColor: 'transparent' }]}>
      <View style={[styles.progressBarBackground, { backgroundColor: colors.fillTertiary }]}>
        <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: getStatusColor() }]} />
      </View>
      <Text style={[styles.progressBarText, { color: colors.textTertiary }]}>
        {sessionsAtWeight} sessions
      </Text>
    </View>
  );
}

function ExerciseProgressCard({ progress, weightUnit }: { progress: ExerciseProgress; weightUnit: string }) {
  const colors = useColors();
  const displayWeight = progress.currentWeight !== null
    ? (weightUnit === 'lbs' ? convertWeight(progress.currentWeight, 'lbs') : progress.currentWeight)
    : null;
  const sourceText = formatSourceWorkouts(progress.sourceWorkouts);

  const getStatusVariant = (): 'success' | 'warning' | 'error' => {
    switch (progress.status) {
      case 'progressing': return 'success';
      case 'maintaining': return 'warning';
      case 'stalled': return 'error';
    }
  };

  return (
    <Card variant="filled" style={styles.progressCard} padding="md">
      <View style={[styles.cardHeader, { backgroundColor: 'transparent' }]}>
        <View style={[styles.exerciseInfo, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>{progress.exerciseName}</Text>
          <Text style={[styles.exerciseEquipment, { color: colors.textSecondary }]}>
            {EQUIPMENT_LABELS[progress.equipment]}
          </Text>
        </View>
        <Badge label={STATUS_LABELS[progress.status]} variant={getStatusVariant()} size="sm" />
      </View>

      <View style={[styles.cardBody, { backgroundColor: 'transparent' }]}>
        {displayWeight !== null ? (
          <>
            <View style={[styles.weightRow, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.currentWeight, { color: colors.text }]}>
                {displayWeight} {weightUnit}
              </Text>
              <Text style={[styles.lastSession, { color: colors.textSecondary }]}>
                Last: {progress.lastSessionReps.join(', ')} reps
              </Text>
            </View>
            <ProgressBar progress={progress} status={progress.status} />
          </>
        ) : (
          <Text style={[styles.noData, { color: colors.textTertiary }]}>No data yet</Text>
        )}

        {progress.readyToIncrease && (
          <View style={[styles.recommendation, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="arrow-up-circle" size={16} color={colors.success} />
            <Text style={[styles.recommendationText, { color: colors.success }]}>
              Ready to increase weight
            </Text>
          </View>
        )}

        {progress.status === 'stalled' && (
          <View style={[styles.recommendation, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="warning" size={16} color={colors.error} />
            <Text style={[styles.recommendationText, { color: colors.error }]}>
              Consider deload or variation
            </Text>
          </View>
        )}

        {sourceText && (
          <View style={[styles.sourceContainer, { borderTopColor: colors.separator, backgroundColor: 'transparent' }]}>
            <Ionicons name="information-circle-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.sourceText, { color: colors.textTertiary }]}>
              Based on: {sourceText}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

function MuscleGroupSection({
  muscle,
  exercises,
  weightUnit,
  expanded,
  onToggle
}: {
  muscle: string;
  exercises: ExerciseProgress[];
  weightUnit: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();
  const progressingCount = exercises.filter(e => e.status === 'progressing').length;
  const stalledCount = exercises.filter(e => e.status === 'stalled').length;

  const handleToggle = () => {
    haptics.selection();
    onToggle();
  };

  return (
    <Card variant="filled" style={styles.muscleSection} padding="none">
      <Pressable
        style={[styles.muscleSectionHeader, { backgroundColor: colors.fillSecondary }]}
        onPress={handleToggle}
      >
        <View style={[styles.muscleTitleContainer, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.muscleSectionTitle, { color: colors.text }]}>
            {MUSCLE_LABELS[muscle] || muscle}
          </Text>
          <View style={[styles.muscleStats, { backgroundColor: 'transparent' }]}>
            {progressingCount > 0 && (
              <Badge label={String(progressingCount)} variant="success" size="sm" />
            )}
            {stalledCount > 0 && (
              <Badge label={String(stalledCount)} variant="error" size="sm" />
            )}
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textTertiary}
        />
      </Pressable>

      {expanded && (
        <View style={[styles.muscleExercises, { backgroundColor: 'transparent' }]}>
          {exercises.map(exercise => (
            <ExerciseProgressCard
              key={exercise.exerciseId}
              progress={exercise}
              weightUnit={weightUnit}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

function FilterTab({
  label,
  active,
  onPress,
  hasDropdown,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  hasDropdown?: boolean;
}) {
  const colors = useColors();

  return (
    <Pressable
      style={[
        styles.filterTab,
        { backgroundColor: active ? colors.primary + '20' : colors.fillTertiary },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterTabText,
          { color: active ? colors.primary : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
      {hasDropdown && (
        <Ionicons
          name="chevron-down"
          size={12}
          color={active ? colors.primary : colors.textSecondary}
          style={{ marginLeft: 2 }}
        />
      )}
    </Pressable>
  );
}

function PickerModal<T extends { id: string }>({
  visible,
  onClose,
  title,
  items,
  selectedId,
  onSelect,
  renderItem,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  renderItem: (item: T, selected: boolean) => React.ReactNode;
}) {
  const colors = useColors();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.modalItem,
                  { borderBottomColor: colors.separator },
                  selectedId === item.id && { backgroundColor: colors.primary + '15' },
                ]}
                onPress={() => {
                  haptics.selection();
                  onSelect(item.id);
                  onClose();
                }}
              >
                {renderItem(item, selectedId === item.id)}
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.modalEmptyState}>
                <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                  No items available
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

export default function InsightsScreen() {
  const { settings } = useSettings();
  const colors = useColors();

  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showSessionPicker, setShowSessionPicker] = useState(false);

  const { splits, standaloneTemplates, loading: templatesLoading, refetch: refetchTemplates } = useWorkoutSplits();
  const { sessions: recentSessions, loading: sessionsLoading, refetch: refetchSessions } = useRecentSessions(5);

  const allTemplates = useMemo(() => {
    const fromSplits = splits.flatMap(s => s.templates);
    return [...fromSplits, ...standaloneTemplates];
  }, [splits, standaloneTemplates]);

  const progressOptions = useMemo(() => {
    if (filterMode === 'template' && selectedTemplateId) {
      return { templateId: selectedTemplateId };
    }
    if (filterMode === 'session' && selectedSessionId) {
      return { sessionId: selectedSessionId };
    }
    return undefined;
  }, [filterMode, selectedTemplateId, selectedSessionId]);

  const { exerciseProgress, loading, error, refetch } = useProgressiveOverload(progressOptions);
  const [expandedMuscles, setExpandedMuscles] = useState<Set<string>>(new Set(MUSCLE_ORDER));

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchTemplates();
      refetchSessions();
    }, [refetch, refetchTemplates, refetchSessions])
  );

  const toggleMuscle = (muscle: string) => {
    setExpandedMuscles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(muscle)) {
        newSet.delete(muscle);
      } else {
        newSet.add(muscle);
      }
      return newSet;
    });
  };

  const handleFilterModeChange = (mode: FilterMode) => {
    haptics.selection();
    if (mode === filterMode) {
      if (mode === 'template') setShowTemplatePicker(true);
      else if (mode === 'session') setShowSessionPicker(true);
      return;
    }

    setFilterMode(mode);
    if (mode === 'all') {
      setSelectedTemplateId(null);
      setSelectedSessionId(null);
    } else if (mode === 'template') {
      setSelectedSessionId(null);
      setShowTemplatePicker(true);
    } else if (mode === 'session') {
      setSelectedTemplateId(null);
      setShowSessionPicker(true);
    }
  };

  const getFilterLabel = (): string => {
    if (filterMode === 'all') return 'Showing all workouts';
    if (filterMode === 'template' && selectedTemplateId) {
      const template = allTemplates.find(t => t.id === selectedTemplateId);
      return `Filtered by: ${template?.name || 'Unknown Template'}`;
    }
    if (filterMode === 'session' && selectedSessionId) {
      const session = recentSessions.find(s => s.id === selectedSessionId);
      return session
        ? `Filtered by: ${session.templateName} (${formatShortDate(session.completedAt)})`
        : 'Filtered by: Unknown Session';
    }
    return '';
  };

  if (loading || templatesLoading || sessionsLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Error: {error.message}</Text>
      </View>
    );
  }

  const exercisesByMuscle = exerciseProgress.reduce((acc, exercise) => {
    const muscle = exercise.primaryMuscle;
    if (!acc[muscle]) acc[muscle] = [];
    acc[muscle].push(exercise);
    return acc;
  }, {} as Record<string, ExerciseProgress[]>);

  const hasData = exerciseProgress.some(e => e.currentWeight !== null);
  const totalProgressing = exerciseProgress.filter(e => e.status === 'progressing').length;
  const totalMaintaining = exerciseProgress.filter(e => e.status === 'maintaining').length;
  const totalStalled = exerciseProgress.filter(e => e.status === 'stalled').length;
  const filterLabel = getFilterLabel();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <Text style={[styles.title, { color: colors.text }]}>Insights</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
          <FilterTab
            label="All Workouts"
            active={filterMode === 'all'}
            onPress={() => handleFilterModeChange('all')}
          />
          <FilterTab
            label={filterMode === 'template' && selectedTemplateId
              ? allTemplates.find(t => t.id === selectedTemplateId)?.name || 'By Template'
              : 'By Template'}
            active={filterMode === 'template'}
            onPress={() => handleFilterModeChange('template')}
            hasDropdown
          />
          <FilterTab
            label={filterMode === 'session' && selectedSessionId ? 'Recent Session' : 'Recent Session'}
            active={filterMode === 'session'}
            onPress={() => handleFilterModeChange('session')}
            hasDropdown
          />
        </ScrollView>
      </View>

      {/* Filter Label */}
      {filterMode !== 'all' && filterLabel && (
        <View style={styles.filterLabelContainer}>
          <Ionicons name="filter" size={14} color={colors.textTertiary} />
          <Text style={[styles.filterLabelText, { color: colors.textSecondary }]}>{filterLabel}</Text>
          <Pressable
            onPress={() => {
              haptics.tap();
              setFilterMode('all');
              setSelectedTemplateId(null);
              setSelectedSessionId(null);
            }}
            style={styles.clearFilterButton}
          >
            <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>
      )}

      {!hasData ? (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Not enough data</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {filterMode === 'all'
              ? 'Complete some workouts to see insights'
              : 'No data for this filter. Try selecting a different workout.'}
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Overall Summary */}
          <View style={styles.summaryContainer}>
            <Card variant="filled" style={[styles.summaryCard, { borderLeftColor: colors.success }]} padding="md">
              <Text style={[styles.summaryNumber, { color: colors.text }]}>{totalProgressing}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Progressing</Text>
            </Card>
            <Card variant="filled" style={[styles.summaryCard, { borderLeftColor: colors.warning }]} padding="md">
              <Text style={[styles.summaryNumber, { color: colors.text }]}>{totalMaintaining}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Maintaining</Text>
            </Card>
            <Card variant="filled" style={[styles.summaryCard, { borderLeftColor: colors.error }]} padding="md">
              <Text style={[styles.summaryNumber, { color: colors.text }]}>{totalStalled}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Stalled</Text>
            </Card>
          </View>

          {/* Muscle Groups */}
          {MUSCLE_ORDER.filter(muscle => exercisesByMuscle[muscle]?.length > 0).map(muscle => (
            <MuscleGroupSection
              key={muscle}
              muscle={muscle}
              exercises={exercisesByMuscle[muscle]}
              weightUnit={settings.weightUnit}
              expanded={expandedMuscles.has(muscle)}
              onToggle={() => toggleMuscle(muscle)}
            />
          ))}
        </View>
      )}

      {/* Template Picker Modal */}
      <PickerModal
        visible={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        title="Select Template"
        items={allTemplates}
        selectedId={selectedTemplateId}
        onSelect={(id) => setSelectedTemplateId(id)}
        renderItem={(item, selected) => (
          <View style={[styles.pickerItemContent, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.pickerItemText, { color: selected ? colors.primary : colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.pickerItemSubtext, { color: colors.textSecondary }]}>
              {item.exerciseCount} exercises
            </Text>
          </View>
        )}
      />

      {/* Session Picker Modal */}
      <PickerModal
        visible={showSessionPicker}
        onClose={() => setShowSessionPicker(false)}
        title="Select Recent Session"
        items={recentSessions}
        selectedId={selectedSessionId}
        onSelect={(id) => setSelectedSessionId(id)}
        renderItem={(item, selected) => (
          <View style={[styles.pickerItemContent, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.pickerItemText, { color: selected ? colors.primary : colors.text }]}>
              {item.templateName}
            </Text>
            <Text style={[styles.pickerItemSubtext, { color: colors.textSecondary }]}>
              {formatShortDate(item.completedAt)}
            </Text>
          </View>
        )}
      />
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
  title: {
    ...Typography.largeTitle,
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
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    borderLeftWidth: 3,
  },
  summaryNumber: {
    ...Typography.title1,
  },
  summaryLabel: {
    ...Typography.caption1,
    marginTop: 2,
  },
  muscleSection: {
    marginBottom: Spacing.md,
  },
  muscleSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.large,
  },
  muscleTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  muscleSectionTitle: {
    ...Typography.headline,
  },
  muscleStats: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  muscleExercises: {
    padding: Spacing.sm,
  },
  progressCard: {
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...Typography.subhead,
    fontWeight: '600',
  },
  exerciseEquipment: {
    ...Typography.caption1,
    marginTop: 2,
  },
  cardBody: {
    marginTop: Spacing.sm,
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentWeight: {
    ...Typography.headline,
  },
  lastSession: {
    ...Typography.caption1,
  },
  noData: {
    ...Typography.footnote,
    fontStyle: 'italic',
  },
  progressBarContainer: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressBarText: {
    ...Typography.caption2,
    width: 60,
  },
  recommendation: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.small,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  recommendationText: {
    ...Typography.caption1,
    fontWeight: '500',
  },
  sourceContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sourceText: {
    ...Typography.caption2,
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  filterScrollContent: {
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTabText: {
    ...Typography.footnote,
    fontWeight: '500',
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  filterLabelText: {
    ...Typography.caption1,
    flex: 1,
  },
  clearFilterButton: {
    padding: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.headline,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalItem: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalEmptyState: {
    padding: Spacing.section,
    alignItems: 'center',
  },
  modalEmptyText: {
    ...Typography.subhead,
  },
  pickerItemContent: {},
  pickerItemText: {
    ...Typography.body,
    fontWeight: '500',
  },
  pickerItemSubtext: {
    ...Typography.caption1,
    marginTop: 2,
  },
});
