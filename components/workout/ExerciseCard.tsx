import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Card, SwipeableRow } from '@/components/ui';
import { Typography, TextStyles } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { SetInput, SetData } from './SetInput';
import { WeightUnit } from '@/hooks/useSettings';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
};

// Map muscle groups to colors
const MUSCLE_COLORS: Record<string, string> = {
  chest: 'muscleChest',
  back: 'muscleBack',
  shoulders: 'muscleShoulders',
  biceps: 'muscleArms',
  triceps: 'muscleArms',
  forearms: 'muscleArms',
  quads: 'muscleLegs',
  hamstrings: 'muscleLegs',
  glutes: 'muscleLegs',
  calves: 'muscleLegs',
  core: 'muscleCore',
};

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  equipment: string;
  primaryMuscle?: string;
  sets: SetData[];
  settings: {
    restSecondsOverride: number | null;
    weightUnitOverride: WeightUnit | null;
  };
}

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  exerciseIndex: number;
  weightUnit: WeightUnit;
  onRemoveExercise: () => void;
  onAddSet: () => void;
  onRemoveSet: (setNumber: number) => void;
  onCompleteSet: (setNumber: number, reps: number, weight: number, effectiveWeightUnit: WeightUnit) => void;
  onOpenMenu: () => void;
  previousSets?: { weight: number; reps: number }[];
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  weightUnit,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  onCompleteSet,
  onOpenMenu,
  previousSets = [],
}: ExerciseCardProps) {
  const colors = useColors();
  const effectiveWeightUnit = exercise.settings.weightUnitOverride ?? weightUnit;

  // Get accent color based on muscle group
  const muscleColorKey = MUSCLE_COLORS[exercise.primaryMuscle || ''] || 'muscleChest';
  const accentColor = (colors as any)[muscleColorKey] || colors.accent;

  const completedSets = exercise.sets.filter(s => s.completed).length;
  const totalSets = exercise.sets.length;
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  return (
    <SwipeableRow onDelete={onRemoveExercise}>
      <Animated.View entering={FadeInDown.duration(300).delay(exerciseIndex * 50)}>
        <Card variant="filled" style={styles.container} padding="none">
          {/* Accent border */}
          <View style={[styles.accentBorder, { backgroundColor: accentColor }]} />

          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              {/* Exercise number badge */}
              <View style={[styles.numberBadge, { backgroundColor: accentColor + '20' }]}>
                <Text style={[styles.numberText, { color: accentColor }]}>
                  {exerciseIndex + 1}
                </Text>
              </View>

              <View style={styles.headerInfo}>
                <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
                  {exercise.name}
                </Text>
                <Text style={[styles.exerciseMeta, { color: colors.textTertiary }]}>
                  {EQUIPMENT_LABELS[exercise.equipment]} · {completedSets}/{totalSets} sets
                </Text>
              </View>

              <Pressable onPress={onOpenMenu} style={styles.menuButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Progress bar */}
            <View style={[styles.progressBar, { backgroundColor: colors.fillTertiary }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: accentColor, width: `${progress * 100}%` },
                ]}
              />
            </View>

            {/* Sets */}
            <View style={styles.setsContainer}>
              {/* Header row */}
              <View style={styles.setHeaderRow}>
                <Text style={[styles.setHeaderText, styles.setCol, { color: colors.textTertiary }]}>SET</Text>
                <Text style={[styles.setHeaderText, styles.weightCol, { color: colors.textTertiary }]}>
                  {effectiveWeightUnit.toUpperCase()}
                </Text>
                <Text style={[styles.setHeaderText, styles.repsCol, { color: colors.textTertiary }]}>REPS</Text>
                <View style={styles.actionCol} />
              </View>

              {exercise.sets.map((set, index) => (
                <SetInput
                  key={set.setNumber}
                  set={set}
                  setIndex={index}
                  weightUnit={effectiveWeightUnit}
                  previousSet={previousSets[index]}
                  onComplete={(reps, weight) => onCompleteSet(set.setNumber, reps, weight, effectiveWeightUnit)}
                  onRemove={() => onRemoveSet(set.setNumber)}
                  canRemove={exercise.sets.length > 1}
                  accentColor={accentColor}
                />
              ))}

              {/* Add set button */}
              <Pressable style={styles.addSetButton} onPress={onAddSet}>
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={[styles.addSetText, { color: colors.primary }]}>Add Set</Text>
              </Pressable>
            </View>
          </View>
        </Card>
      </Animated.View>
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  accentBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: Radius.large,
    borderBottomLeftRadius: Radius.large,
  },
  content: {
    padding: Spacing.md,
    paddingLeft: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  numberText: {
    ...TextStyles.setNumber,
  },
  headerInfo: {
    flex: 1,
  },
  exerciseName: {
    ...TextStyles.exerciseName,
  },
  exerciseMeta: {
    ...Typography.caption1,
    marginTop: 2,
  },
  menuButton: {
    padding: Spacing.sm,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  setsContainer: {
    gap: Spacing.xs,
  },
  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  setHeaderText: {
    ...TextStyles.statLabel,
    textAlign: 'center',
  },
  setCol: {
    width: 40,
  },
  weightCol: {
    flex: 1,
  },
  repsCol: {
    flex: 1,
  },
  actionCol: {
    width: 40,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  addSetText: {
    ...Typography.subhead,
    fontWeight: '500',
  },
});

export default ExerciseCard;
