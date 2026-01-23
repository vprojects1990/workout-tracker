import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useProgressiveOverload, ExerciseProgress, ProgressStatus } from '@/hooks/useProgressiveOverload';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

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

function ExerciseProgressCard({ progress }: { progress: ExerciseProgress }) {
  const statusColor = STATUS_COLORS[progress.status];

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
        <Text style={styles.repRange}>
          Target: {progress.targetRepMin}-{progress.targetRepMax} reps
        </Text>

        {progress.currentWeight !== null ? (
          <>
            <Text style={styles.currentWeight}>
              Current: {progress.currentWeight} kg
            </Text>
            <Text style={styles.lastSession}>
              Last session: {progress.lastSessionReps.join(', ')} reps
            </Text>
            {progress.sessionsAtCurrentWeight > 1 && (
              <Text style={styles.sessionsAtWeight}>
                {progress.sessionsAtCurrentWeight} sessions at this weight
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.noData}>No data yet</Text>
        )}

        {progress.readyToIncrease && (
          <View style={styles.recommendation}>
            <Text style={styles.recommendationText}>
              Ready to increase weight
            </Text>
          </View>
        )}

        {progress.status === 'stalled' && (
          <View style={[styles.recommendation, styles.stalledRecommendation]}>
            <Text style={styles.stalledText}>
              Consider deload or variation
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const { exerciseProgress, loading, error, refetch } = useProgressiveOverload();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

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

  const progressing = exerciseProgress.filter(e => e.status === 'progressing');
  const maintaining = exerciseProgress.filter(e => e.status === 'maintaining');
  const stalled = exerciseProgress.filter(e => e.status === 'stalled');

  const hasData = exerciseProgress.some(e => e.currentWeight !== null);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progressive Overload</Text>
        <Text style={styles.subtitle}>Track your double progression</Text>
      </View>

      {!hasData ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Not enough data</Text>
          <Text style={styles.emptySubtext}>Complete some workouts to see insights</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {stalled.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stalled ({stalled.length})</Text>
              {stalled.map(p => (
                <ExerciseProgressCard key={p.exerciseId} progress={p} />
              ))}
            </View>
          )}

          {progressing.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Progressing ({progressing.length})</Text>
              {progressing.map(p => (
                <ExerciseProgressCard key={p.exerciseId} progress={p} />
              ))}
            </View>
          )}

          {maintaining.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Maintaining ({maintaining.length})</Text>
              {maintaining.map(p => (
                <ExerciseProgressCard key={p.exerciseId} progress={p} />
              ))}
            </View>
          )}
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseEquipment: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  repRange: {
    fontSize: 14,
    opacity: 0.7,
  },
  currentWeight: {
    fontSize: 14,
    marginTop: 4,
  },
  lastSession: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  sessionsAtWeight: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  noData: {
    fontSize: 14,
    opacity: 0.5,
    fontStyle: 'italic',
  },
  recommendation: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 8,
  },
  recommendationText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  stalledRecommendation: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  stalledText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '500',
  },
});
