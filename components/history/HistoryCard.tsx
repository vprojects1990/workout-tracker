import React from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Card, Badge } from '@/components/ui';
import { Typography, TextStyles } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { VolumeChart } from './VolumeChart';
import { convertWeight, WeightUnit } from '@/hooks/useSettings';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
};

export interface WorkoutHistoryItem {
  id: string;
  templateName: string;
  completedAt: Date;
  durationSeconds: number;
  exerciseCount: number;
  totalSets: number;
  totalVolume?: number;
}

export interface ExerciseDetail {
  exerciseId: string;
  name: string;
  equipment: string;
  sets: { reps: number; weight: number }[];
  maxWeight: number;
  isPR: boolean;
}

interface HistoryCardProps {
  item: WorkoutHistoryItem;
  details: ExerciseDetail[];
  detailsLoading: boolean;
  weightUnit: WeightUnit;
  expanded: boolean;
  onToggle: () => void;
  cardIndex: number;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return mins + 'm';
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return hours + 'h ' + remainingMins + 'm';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function HistoryCard({
  item,
  details,
  detailsLoading,
  weightUnit,
  expanded,
  onToggle,
  cardIndex,
}: HistoryCardProps) {
  const colors = useColors();

  const handleToggle = () => {
    Haptics.selectionAsync();
    onToggle();
  };

  // Check if any exercise has a PR
  const hasPR = details.some(d => d.isPR);

  // Calculate volume for the mini chart (simplified - just show set counts per exercise)
  const volumeData = details.map(d => d.sets.length);

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(cardIndex * 50)}
      layout={Layout.springify()}
    >
      <Card variant="filled" style={styles.container} padding="none">
        {/* Header */}
        <Pressable style={styles.header} onPress={handleToggle}>
          <View style={styles.headerLeft}>
            {/* Date badge */}
            <View style={[styles.dateBadge, { backgroundColor: colors.accent + '15' }]}>
              <Text style={[styles.dateBadgeText, { color: colors.accent }]}>
                {formatDate(item.completedAt)}
              </Text>
            </View>

            <Text style={[styles.templateName, { color: colors.text }]} numberOfLines={1}>
              {item.templateName}
            </Text>

            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {formatDuration(item.durationSeconds)} · {formatTime(item.completedAt)}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {hasPR && (
              <View style={[styles.prBadge, { backgroundColor: colors.prBadge + '20' }]}>
                <Ionicons name="trophy" size={12} color={colors.prBadge} />
                <Text style={[styles.prBadgeText, { color: colors.prBadge }]}>PR</Text>
              </View>
            )}
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textTertiary}
            />
          </View>
        </Pressable>

        {/* Summary row (when collapsed) */}
        {!expanded && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryStats}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {item.exerciseCount}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>exercises</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.separator }]} />
            <View style={styles.summaryStats}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {item.totalSets}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>sets</Text>
            </View>
            {volumeData.length > 0 && (
              <>
                <View style={[styles.summaryDivider, { backgroundColor: colors.separator }]} />
                <VolumeChart data={volumeData} height={24} width={60} />
              </>
            )}
          </View>
        )}

        {/* Expanded details */}
        {expanded && (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[styles.details, { borderTopColor: colors.separator }]}
          >
            {detailsLoading ? (
              <ActivityIndicator size="small" color={colors.accent} style={styles.loader} />
            ) : (
              details.map((exercise, index) => (
                <View
                  key={exercise.exerciseId}
                  style={[
                    styles.exerciseRow,
                    index < details.length - 1 && { borderBottomColor: colors.separator, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <View style={styles.exerciseLeft}>
                    <View style={styles.exerciseNameRow}>
                      <Text style={[styles.setCount, { color: colors.textTertiary }]}>
                        {exercise.sets.length}×
                      </Text>
                      <View style={styles.exerciseNameCol}>
                        <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
                          {exercise.name}
                        </Text>
                        <Text style={[styles.exerciseEquipment, { color: colors.textQuaternary }]}>
                          {EQUIPMENT_LABELS[exercise.equipment]}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.exerciseRight}>
                    <Text style={[styles.exerciseWeight, { color: colors.text }]}>
                      {convertWeight(exercise.maxWeight, weightUnit)} {weightUnit}
                    </Text>
                    {exercise.isPR && (
                      <Badge label="PR" variant="warning" size="sm" />
                    )}
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        )}
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  dateBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.small,
    marginBottom: Spacing.xs,
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  templateName: {
    ...TextStyles.exerciseName,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...Typography.caption1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.small,
    gap: 4,
  },
  prBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  summaryStats: {
    alignItems: 'center',
  },
  summaryValue: {
    ...TextStyles.statValueSmall,
    fontSize: 16,
  },
  summaryLabel: {
    ...Typography.caption2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
  },
  details: {
    borderTopWidth: 1,
    padding: Spacing.md,
  },
  loader: {
    paddingVertical: Spacing.md,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  exerciseLeft: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  setCount: {
    ...Typography.subhead,
    fontWeight: '600',
    width: 24,
  },
  exerciseNameCol: {
    flex: 1,
  },
  exerciseName: {
    ...Typography.subhead,
    fontWeight: '500',
  },
  exerciseEquipment: {
    ...Typography.caption2,
  },
  exerciseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  exerciseWeight: {
    ...TextStyles.numericSmall,
    fontWeight: '600',
  },
});

export default HistoryCard;
