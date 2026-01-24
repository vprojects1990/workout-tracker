import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Card } from '@/components/ui';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';

interface QuickStatsCardProps {
  workoutCount: number;
  streak: number;
  hasHistory: boolean;
}

export function QuickStatsCard({ workoutCount, streak, hasHistory }: QuickStatsCardProps) {
  const colors = useColors();

  if (!hasHistory) {
    return (
      <Card variant="filled" style={styles.container} padding="md">
        <View style={styles.emptyState}>
          <Ionicons name="fitness-outline" size={20} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Complete your first workout to see stats
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card variant="filled" style={styles.container} padding="md">
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={16} color={colors.textSecondary} />
        <Text style={[styles.headerText, { color: colors.textSecondary }]}>THIS WEEK</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{workoutCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
            {workoutCount === 1 ? 'workout' : 'workouts'}
          </Text>
        </View>
        <View style={[styles.separator, { backgroundColor: colors.separator }]} />
        <View style={styles.statItem}>
          <View style={styles.streakValue}>
            <Ionicons name="flame" size={18} color={colors.systemOrange} />
            <Text style={[styles.statValue, { color: colors.text }]}>{streak}</Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>day streak</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  headerText: {
    ...Typography.caption1,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.title2,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption1,
    marginTop: 2,
  },
  streakValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  separator: {
    width: 1,
    height: 32,
    marginHorizontal: Spacing.md,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  emptyText: {
    ...Typography.footnote,
  },
});

export default QuickStatsCard;
