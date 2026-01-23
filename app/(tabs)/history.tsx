import { StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useWorkoutHistory, WorkoutHistoryItem } from '@/hooks/useWorkoutHistory';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return mins + 'm';
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return hours + 'h ' + remainingMins + 'm';
}

function HistoryCard({ item }: { item: WorkoutHistoryItem }) {
  return (
    <Pressable style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.templateName}>{item.templateName}</Text>
        <Text style={styles.date}>{formatDate(item.completedAt)}</Text>
      </View>
      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDuration(item.durationSeconds)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.exerciseCount}</Text>
          <Text style={styles.statLabel}>Exercises</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.totalSets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.totalVolume}</Text>
          <Text style={styles.statLabel}>Volume (kg)</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const { history, loading, error, refetch } = useWorkoutHistory();

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Your past workouts</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptySubtext}>Complete a workout to see it here</Text>
        </View>
      ) : (
        <View style={styles.historyList}>
          {history.map(item => (
            <HistoryCard key={item.id} item={item} />
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
  historyList: {
    padding: 20,
    paddingTop: 0,
  },
  historyCard: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    opacity: 0.7,
  },
  cardStats: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
});
