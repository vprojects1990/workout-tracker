import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Typography, TextStyles } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { Confetti } from './Confetti';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withDelay,
  withTiming,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PRCelebrationProps {
  visible: boolean;
  exerciseName: string;
  weight: number;
  unit: string;
  previousBest?: number;
  onDismiss: () => void;
}

export function PRCelebration({
  visible,
  exerciseName,
  weight,
  unit,
  previousBest,
  onDismiss,
}: PRCelebrationProps) {
  const colors = useColors();
  const scale = useSharedValue(0);
  const badgeRotation = useSharedValue(-10);
  const starScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Badge animation
      scale.value = withSequence(
        withSpring(1.1, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 150 })
      );

      badgeRotation.value = withSequence(
        withSpring(5, { damping: 8, stiffness: 200 }),
        withSpring(0, { damping: 10, stiffness: 150 })
      );

      // Star animation
      starScale.value = withDelay(
        200,
        withSequence(
          withSpring(1.3, { damping: 6, stiffness: 250 }),
          withSpring(1, { damping: 10, stiffness: 200 })
        )
      );

      // Auto dismiss
      const timeout = setTimeout(() => {
        onDismiss();
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${badgeRotation.value}deg` },
    ],
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  if (!visible) return null;

  const improvement = previousBest ? weight - previousBest : null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      <Confetti active={visible} colors={[colors.prBadge, colors.success, '#FFD60A']} />

      <Animated.View style={[styles.card, { backgroundColor: colors.card }, containerStyle]}>
        {/* Trophy/star icon */}
        <Animated.View style={[styles.iconContainer, { backgroundColor: colors.prBadge + '20' }, starStyle]}>
          <Ionicons name="trophy" size={48} color={colors.prBadge} />
        </Animated.View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.prBadge }]}>NEW PR!</Text>

        {/* Exercise name */}
        <Text style={[styles.exerciseName, { color: colors.text }]} numberOfLines={1}>
          {exerciseName}
        </Text>

        {/* Weight */}
        <View style={styles.weightContainer}>
          <Text style={[styles.weight, { color: colors.text }]}>
            {weight}
          </Text>
          <Text style={[styles.unit, { color: colors.textSecondary }]}>{unit}</Text>
        </View>

        {/* Improvement */}
        {improvement !== null && improvement > 0 && (
          <View style={[styles.improvementBadge, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="arrow-up" size={14} color={colors.success} />
            <Text style={[styles.improvementText, { color: colors.success }]}>
              +{improvement} {unit} from previous best
            </Text>
          </View>
        )}

        {/* Dismiss hint */}
        <Text style={[styles.dismissHint, { color: colors.textQuaternary }]}>
          Tap anywhere to dismiss
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  card: {
    width: SCREEN_WIDTH * 0.85,
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  exerciseName: {
    ...Typography.title3,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  weight: {
    ...TextStyles.statValueLarge,
  },
  unit: {
    ...Typography.title2,
    marginLeft: Spacing.xs,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  improvementText: {
    ...Typography.subhead,
    fontWeight: '600',
  },
  dismissHint: {
    ...Typography.caption1,
  },
});

export default PRCelebration;
