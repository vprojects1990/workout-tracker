import { useState, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Pressable, Modal, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useProgressiveOverload, ExerciseProgress, ProgressStatus, SourceWorkout } from '@/hooks/useProgressiveOverload';
import { useFocusEffect } from 'expo-router';
import { useSettings, convertWeight } from '@/hooks/useSettings';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { useWorkoutSplits, TemplateWithDetails } from '@/hooks/useWorkoutTemplates';
import { db } from '@/db';
import { workoutSessions } from '@/db/schema';
import { desc, isNotNull } from 'drizzle-orm';

type FilterMode = 'all' | 'template' | 'session';

type RecentSession = {
  id: string;
  templateName: string;
  completedAt: Date;
};

// Hook to fetch recent sessions
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

const STATUS_COLORS: Record<ProgressStatus, string> = {
  progressing: '#4CAF50',
  maintaining: '#FFC107',
  stalled: '#f44336',
};

const STATUS_LABELS: Record<ProgressStatus, string> = {
  progressing: 'Progressing',
  maintaining: 'Maintaining',
  stalled: 'Stalled',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
};

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

const MUSCLE_ORDER = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core'];

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSourceWorkouts(sourceWorkouts: SourceWorkout[]): string {
  if (sourceWorkouts.length === 0) return '';

  // Get unique template names (non-null)
  const uniqueTemplates = [...new Set(
    sourceWorkouts
      .map(sw => sw.templateName)
      .filter((name): name is string => name !== null)
  )];

  // Check if there are any "empty workouts" (null template names)
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
  // Calculate progress percentage based on sessions at current weight
  // Max out at 3 sessions (after which it's considered stalled)
  const sessionsAtWeight = progress.sessionsAtCurrentWeight;
  const percentage = Math.min(sessionsAtWeight / 3, 1) * 100;
  const color = STATUS_COLORS[status];

  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.progressBarText}>{sessionsAtWeight} sessions</Text>
    </View>
  );
}

function ExerciseProgressCard({ progress, weightUnit }: { progress: ExerciseProgress; weightUnit: string }) {
  const statusColor = STATUS_COLORS[progress.status];
  const displayWeight = progress.currentWeight !== null
    ? (weightUnit === 'lbs' ? convertWeight(progress.currentWeight, 'lbs') : progress.currentWeight)
    : null;

  const sourceText = formatSourceWorkouts(progress.sourceWorkouts);

  return (
    <View style={styles.progressCard}>
      <View style={styles.cardHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{progress.exerciseName}</Text>
          <Text style={styles.exerciseEquipment}>{EQUIPMENT_LABELS[progress.equipment]}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[progress.status]}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {displayWeight !== null ? (
          <>
            <View style={styles.weightRow}>
              <Text style={styles.currentWeight}>{displayWeight} {weightUnit}</Text>
              <Text style={styles.lastSession}>
                Last: {progress.lastSessionReps.join(', ')} reps
              </Text>
            </View>
            <ProgressBar progress={progress} status={progress.status} />
          </>
        ) : (
          <Text style={styles.noData}>No data yet</Text>
        )}

        {progress.readyToIncrease && (
          <View style={styles.recommendation}>
            <Ionicons name="arrow-up-circle" size={16} color="#4CAF50" />
            <Text style={styles.recommendationText}>Ready to increase weight</Text>
          </View>
        )}

        {progress.status === 'stalled' && (
          <View style={[styles.recommendation, styles.stalledRecommendation]}>
            <Ionicons name="warning" size={16} color="#f44336" />
            <Text style={styles.stalledText}>Consider deload or variation</Text>
          </View>
        )}

        {sourceText && (
          <View style={styles.sourceContainer}>
            <Ionicons name="information-circle-outline" size={12} color="rgba(128, 128, 128, 0.7)" />
            <Text style={styles.sourceText}>Based on: {sourceText}</Text>
          </View>
        )}
      </View>
    </View>
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
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';

  const progressingCount = exercises.filter(e => e.status === 'progressing').length;
  const stalledCount = exercises.filter(e => e.status === 'stalled').length;

  return (
    <View style={styles.muscleSection}>
      <Pressable style={styles.muscleSectionHeader} onPress={onToggle}>
        <View style={styles.muscleTitleContainer}>
          <Text style={styles.muscleSectionTitle}>{MUSCLE_LABELS[muscle] || muscle}</Text>
          <View style={styles.muscleStats}>
            {progressingCount > 0 && (
              <View style={[styles.miniStatBadge, { backgroundColor: STATUS_COLORS.progressing }]}>
                <Text style={styles.miniStatText}>{progressingCount}</Text>
              </View>
            )}
            {stalledCount > 0 && (
              <View style={[styles.miniStatBadge, { backgroundColor: STATUS_COLORS.stalled }]}>
                <Text style={styles.miniStatText}>{stalledCount}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={iconColor}
        />
      </Pressable>

      {expanded && (
        <View style={styles.muscleExercises}>
          {exercises.map(exercise => (
            <ExerciseProgressCard
              key={exercise.exerciseId}
              progress={exercise}
              weightUnit={weightUnit}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// Filter Tab Button Component
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
  const colorScheme = useColorScheme();

  return (
    <Pressable
      style={[
        styles.filterTab,
        active && styles.filterTabActive,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterTabText,
          active && styles.filterTabTextActive,
        ]}
      >
        {label}
      </Text>
      {hasDropdown && (
        <Ionicons
          name="chevron-down"
          size={12}
          color={active ? '#007AFF' : (colorScheme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)')}
          style={{ marginLeft: 2 }}
        />
      )}
    </Pressable>
  );
}

// Picker Modal Component
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
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#1c1c1e' : '#fff';
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>{title}</Text>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={textColor} />
            </Pressable>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.modalItem,
                  selectedId === item.id && styles.modalItemSelected,
                ]}
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                {renderItem(item, selectedId === item.id)}
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.modalEmptyState}>
                <Text style={[styles.modalEmptyText, { color: textColor }]}>No items available</Text>
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
  const colorScheme = useColorScheme();
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showSessionPicker, setShowSessionPicker] = useState(false);

  // Fetch data for filters
  const { splits, standaloneTemplates, loading: templatesLoading, refetch: refetchTemplates } = useWorkoutSplits();
  const { sessions: recentSessions, loading: sessionsLoading, refetch: refetchSessions } = useRecentSessions(5);

  // Compute all templates from splits + standalone
  const allTemplates = useMemo(() => {
    const fromSplits = splits.flatMap(s => s.templates);
    return [...fromSplits, ...standaloneTemplates];
  }, [splits, standaloneTemplates]);

  // Build options for useProgressiveOverload based on filter
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

  // Handle filter mode changes
  const handleFilterModeChange = (mode: FilterMode) => {
    if (mode === filterMode) {
      // If clicking same mode, toggle dropdown for template/session
      if (mode === 'template') {
        setShowTemplatePicker(true);
      } else if (mode === 'session') {
        setShowSessionPicker(true);
      }
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

  // Get current filter label
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

  // Group exercises by muscle
  const exercisesByMuscle = exerciseProgress.reduce((acc, exercise) => {
    const muscle = exercise.primaryMuscle;
    if (!acc[muscle]) acc[muscle] = [];
    acc[muscle].push(exercise);
    return acc;
  }, {} as Record<string, ExerciseProgress[]>);

  const hasData = exerciseProgress.some(e => e.currentWeight !== null);

  // Overall stats
  const totalProgressing = exerciseProgress.filter(e => e.status === 'progressing').length;
  const totalMaintaining = exerciseProgress.filter(e => e.status === 'maintaining').length;
  const totalStalled = exerciseProgress.filter(e => e.status === 'stalled').length;

  const filterLabel = getFilterLabel();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
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
            label={filterMode === 'session' && selectedSessionId
              ? 'Recent Session'
              : 'Recent Session'}
            active={filterMode === 'session'}
            onPress={() => handleFilterModeChange('session')}
            hasDropdown
          />
        </ScrollView>
      </View>

      {/* Filter Label */}
      {filterMode !== 'all' && filterLabel && (
        <View style={styles.filterLabelContainer}>
          <Ionicons name="filter" size={14} color="rgba(128, 128, 128, 0.7)" />
          <Text style={styles.filterLabelText}>{filterLabel}</Text>
          <Pressable
            onPress={() => {
              setFilterMode('all');
              setSelectedTemplateId(null);
              setSelectedSessionId(null);
            }}
            style={styles.clearFilterButton}
          >
            <Ionicons name="close-circle" size={16} color="rgba(128, 128, 128, 0.7)" />
          </Pressable>
        </View>
      )}

      {!hasData ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Not enough data</Text>
          <Text style={styles.emptySubtext}>
            {filterMode === 'all'
              ? 'Complete some workouts to see insights'
              : 'No data for this filter. Try selecting a different workout.'}
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Overall Summary */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { borderLeftColor: STATUS_COLORS.progressing }]}>
              <Text style={styles.summaryNumber}>{totalProgressing}</Text>
              <Text style={styles.summaryLabel}>Progressing</Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: STATUS_COLORS.maintaining }]}>
              <Text style={styles.summaryNumber}>{totalMaintaining}</Text>
              <Text style={styles.summaryLabel}>Maintaining</Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: STATUS_COLORS.stalled }]}>
              <Text style={styles.summaryNumber}>{totalStalled}</Text>
              <Text style={styles.summaryLabel}>Stalled</Text>
            </View>
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
          <View style={styles.pickerItemContent}>
            <Text style={[styles.pickerItemText, { color: textColor }, selected && styles.pickerItemTextSelected]}>
              {item.name}
            </Text>
            <Text style={styles.pickerItemSubtext}>{item.exerciseCount} exercises</Text>
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
          <View style={styles.pickerItemContent}>
            <Text style={[styles.pickerItemText, { color: textColor }, selected && styles.pickerItemTextSelected]}>
              {item.templateName}
            </Text>
            <Text style={styles.pickerItemSubtext}>{formatShortDate(item.completedAt)}</Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    marginTop: 8,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  // Summary cards
  summaryContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  // Muscle sections
  muscleSection: {
    marginBottom: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  muscleSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  muscleTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  muscleSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  muscleStats: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'transparent',
  },
  miniStatBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniStatText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  muscleExercises: {
    padding: 8,
    backgroundColor: 'transparent',
  },
  // Exercise cards
  progressCard: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  exerciseInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
  },
  exerciseEquipment: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardBody: {
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  currentWeight: {
    fontSize: 16,
    fontWeight: '600',
  },
  lastSession: {
    fontSize: 12,
    opacity: 0.6,
  },
  noData: {
    fontSize: 13,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  // Progress bar
  progressBarContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressBarText: {
    fontSize: 10,
    opacity: 0.5,
    width: 60,
  },
  // Recommendations
  recommendation: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recommendationText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  stalledRecommendation: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  stalledText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '500',
  },
  // Source info
  sourceContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  sourceText: {
    fontSize: 10,
    opacity: 0.5,
    flex: 1,
  },
  // Filter UI
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterScrollContent: {
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  filterTabTextActive: {
    color: '#007AFF',
    opacity: 1,
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 6,
  },
  filterLabelText: {
    fontSize: 12,
    opacity: 0.6,
    flex: 1,
  },
  clearFilterButton: {
    padding: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 34,
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
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  modalItemSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  modalEmptyState: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 14,
    opacity: 0.5,
  },
  pickerItemContent: {
    backgroundColor: 'transparent',
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: '#007AFF',
  },
  pickerItemSubtext: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
});
