import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Typography, TextStyles } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';

interface WorkoutProgressProps {
  elapsedSeconds: number;
  completedSets: number;
  totalSets: number;
  exercisesRemaining: number;
  onCancel: () => void;
  onFinish: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ':' + secs.toString().padStart(2, '0');
}

export function WorkoutProgress({
  elapsedSeconds,
  completedSets,
  totalSets,
  exercisesRemaining,
  onCancel,
  onFinish,
}: WorkoutProgressProps) {
  const colors = useColors();

  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[styles.container, { borderBottomColor: colors.separator }]}
    >
      {/* Progress bar at very top */}
      <View style={[styles.progressBar, { backgroundColor: colors.fillTertiary }]}>
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: colors.accent, width: `${progress * 100}%` },
          ]}
        />
      </View>

      {/* Header content */}
      <View style={styles.header}>
        {/* Cancel button */}
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
        </Pressable>

        {/* Center stats */}
        <View style={styles.stats}>
          {/* Timer */}
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.timerText, { color: colors.text }]}>
              {formatTime(elapsedSeconds)}
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />

          {/* Sets completed */}
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {completedSets}
              <Text style={{ color: colors.textTertiary }}>/{totalSets}</Text>
            </Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>sets</Text>
          </View>
        </View>

        {/* Finish button */}
        <Pressable
          onPress={onFinish}
          style={[styles.finishButton, { backgroundColor: colors.success + '15' }]}
        >
          <Text style={[styles.finishText, { color: colors.success }]}>Finish</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingTop: 60,
  },
  progressBar: {
    height: 3,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
  },
  cancelText: {
    ...Typography.body,
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timerText: {
    ...TextStyles.numericSmall,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    ...TextStyles.numericSmall,
    fontWeight: '600',
  },
  statLabel: {
    ...Typography.caption2,
  },
  finishButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.medium,
  },
  finishText: {
    ...Typography.body,
    fontWeight: '600',
  },
});

export default WorkoutProgress;
