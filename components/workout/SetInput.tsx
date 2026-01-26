import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, TextInput } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Typography, TextStyles } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { WeightUnit, convertWeight } from '@/hooks/useSettings';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';

export interface SetData {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  completed: boolean;
}

interface SetInputProps {
  set: SetData;
  setIndex: number;
  weightUnit: WeightUnit;
  previousSet?: { weight: number; reps: number };
  onComplete: (reps: number, weight: number) => void;
  onRemove: () => void;
  canRemove: boolean;
  accentColor: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SetInput({
  set,
  setIndex,
  weightUnit,
  previousSet,
  onComplete,
  onRemove,
  canRemove,
  accentColor,
}: SetInputProps) {
  const colors = useColors();
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const checkScale = useSharedValue(1);
  const rowScale = useSharedValue(1);

  const handleComplete = () => {
    const repsNum = parseInt(reps, 10);
    const weightNum = parseFloat(weight);
    if (!isNaN(repsNum) && !isNaN(weightNum)) {
      // Celebration animation
      checkScale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 8, stiffness: 300 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(repsNum, weightNum);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const handlePressIn = () => {
    rowScale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    rowScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rowScale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  // Format previous set hint
  const weightHint = previousSet
    ? String(convertWeight(previousSet.weight, weightUnit))
    : weightUnit;
  const repsHint = previousSet ? String(previousSet.reps) : 'Reps';

  if (set.completed) {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        style={[styles.completedRow, { backgroundColor: colors.success + '08' }]}
      >
        <View style={styles.setCol}>
          <Text style={[styles.setNumber, { color: colors.success }]}>{set.setNumber}</Text>
        </View>
        <View style={styles.weightCol}>
          <Text style={[styles.completedValue, { color: colors.text }]}>
            {set.weight !== null ? convertWeight(set.weight, weightUnit) : '-'}
          </Text>
        </View>
        <View style={styles.repsCol}>
          <Text style={[styles.completedValue, { color: colors.text }]}>{set.reps}</Text>
        </View>
        <View style={styles.actionCol}>
          <Animated.View style={[styles.completedBadge, { backgroundColor: colors.success }, checkAnimatedStyle]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </Animated.View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.inputRow, rowAnimatedStyle]}>
      <View style={styles.setCol}>
        <View style={styles.setNumberContainer}>
          <Text style={[styles.setNumber, { color: colors.text }]}>{set.setNumber}</Text>
          {canRemove && (
            <Pressable onPress={onRemove} style={styles.removeButton} hitSlop={8}>
              <Ionicons name="close-circle" size={14} color={colors.error} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.weightCol}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.inputBackground, color: colors.text },
          ]}
          value={weight}
          onChangeText={setWeight}
          placeholder={weightHint}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.textQuaternary}
          selectTextOnFocus
        />
      </View>

      <View style={styles.repsCol}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.inputBackground, color: colors.text },
          ]}
          value={reps}
          onChangeText={setReps}
          placeholder={repsHint}
          keyboardType="number-pad"
          placeholderTextColor={colors.textQuaternary}
          selectTextOnFocus
        />
      </View>

      <View style={styles.actionCol}>
        <AnimatedPressable
          style={[styles.completeButton, { backgroundColor: accentColor }]}
          onPress={handleComplete}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.medium,
    gap: Spacing.sm,
  },
  setCol: {
    width: 40,
    alignItems: 'center',
  },
  weightCol: {
    flex: 1,
  },
  repsCol: {
    flex: 1,
  },
  actionCol: {
    width: 40,
    alignItems: 'center',
  },
  setNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setNumber: {
    ...TextStyles.setNumber,
  },
  removeButton: {
    marginLeft: 2,
  },
  input: {
    height: 44,
    borderRadius: Radius.medium,
    textAlign: 'center',
    ...TextStyles.numericInput,
    fontSize: 16,
  },
  completeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  completedBadge: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  completedValue: {
    ...Typography.body,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default SetInput;
