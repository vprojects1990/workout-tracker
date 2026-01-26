import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Card } from '@/components/ui';
import { Typography, TextStyles } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { StreakDisplay } from './StreakDisplay';
import { WeekCalendar } from './WeekCalendar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';

interface QuickStatsCardProps {
  workoutCount: number;
  streak: number;
  hasHistory: boolean;
  workoutDays?: number[]; // Days of the week that had workouts (0=Mon, 6=Sun)
}

export function QuickStatsCard({
  workoutCount,
  streak,
  hasHistory,
  workoutDays = [],
}: QuickStatsCardProps) {
  const colors = useColors();
  const countAnimation = useSharedValue(0);

  useEffect(() => {
    if (hasHistory) {
      // Animate count up
      countAnimation.value = withDelay(
        200,
        withTiming(workoutCount, {
          duration: 800,
          easing: Easing.out(Easing.cubic),
        })
      );
    }
  }, [workoutCount, hasHistory]);

  const countStyle = useAnimatedStyle(() => ({
    opacity: withSpring(1, { damping: 20 }),
  }));

  if (!hasHistory) {
    return (
      <Card variant="filled" style={styles.container} padding="lg">
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.emptyState}
        >
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.fillTertiary }]}>
            <Ionicons name="barbell-outline" size={28} color={colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Start Your Journey
          </Text>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Complete your first workout to track your progress
          </Text>
        </Animated.View>
      </Card>
    );
  }

  return (
    <Card variant="filled" style={styles.container} padding="lg">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.headerText, { color: colors.textTertiary }]}>THIS WEEK</Text>
        </View>
      </View>

      {/* Main Stats Row */}
      <View style={styles.statsRow}>
        {/* Workout Count */}
        <Animated.View style={[styles.statItem, countStyle]}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {workoutCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
            {workoutCount === 1 ? 'WORKOUT' : 'WORKOUTS'}
          </Text>
        </Animated.View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.separator }]} />

        {/* Streak */}
        <View style={styles.statItem}>
          <StreakDisplay streak={streak} size="md" />
        </View>
      </View>

      {/* Week Calendar */}
      <View style={styles.calendarContainer}>
        <WeekCalendar workoutDays={workoutDays} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerText: {
    ...TextStyles.statLabel,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    ...TextStyles.statValue,
  },
  statLabel: {
    ...TextStyles.statLabel,
    marginTop: Spacing.xs,
  },
  divider: {
    width: 1,
    height: 48,
    marginHorizontal: Spacing.lg,
  },
  calendarContainer: {
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.headline,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    ...Typography.footnote,
    textAlign: 'center',
  },
});

export default QuickStatsCard;
