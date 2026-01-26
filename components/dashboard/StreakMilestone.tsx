import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Pressable } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Typography, TextStyles } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { Confetti } from '@/components/animations/Confetti';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withDelay,
  withRepeat,
  withTiming,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StreakMilestoneProps {
  visible: boolean;
  streakCount: number;
  onDismiss: () => void;
}

const MILESTONES = [7, 14, 30, 60, 90, 100, 150, 200, 365];

function getMilestoneInfo(streak: number) {
  if (streak >= 365) return { emoji: '👑', title: 'LEGENDARY', subtitle: 'One full year!' };
  if (streak >= 200) return { emoji: '💎', title: 'DIAMOND', subtitle: 'Unstoppable force!' };
  if (streak >= 150) return { emoji: '🔥', title: 'ON FIRE', subtitle: 'Incredible dedication!' };
  if (streak >= 100) return { emoji: '💯', title: 'CENTURY', subtitle: '100 days strong!' };
  if (streak >= 90) return { emoji: '🏆', title: 'CHAMPION', subtitle: '3 months of consistency!' };
  if (streak >= 60) return { emoji: '⭐', title: 'SUPERSTAR', subtitle: '2 months crushing it!' };
  if (streak >= 30) return { emoji: '🎯', title: 'COMMITTED', subtitle: 'One month milestone!' };
  if (streak >= 14) return { emoji: '💪', title: 'DEDICATED', subtitle: 'Two weeks strong!' };
  if (streak >= 7) return { emoji: '🌟', title: 'WEEK ONE', subtitle: 'Great start!' };
  return { emoji: '🔥', title: 'STREAK', subtitle: 'Keep going!' };
}

export function StreakMilestone({
  visible,
  streakCount,
  onDismiss,
}: StreakMilestoneProps) {
  const colors = useColors();
  const scale = useSharedValue(0);
  const flameScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  const { emoji, title, subtitle } = getMilestoneInfo(streakCount);

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Main card animation
      scale.value = withSequence(
        withSpring(1.05, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 150 })
      );

      // Pulsing flame
      flameScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      // Pulsing glow
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Pressable style={styles.overlay} onPress={onDismiss}>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={StyleSheet.absoluteFill}
      >
        <Confetti
          active={visible}
          colors={[colors.streakActive, colors.prBadge, '#FFD60A', colors.success]}
          pieceCount={60}
        />

        <View style={styles.content}>
          <Animated.View style={[styles.card, { backgroundColor: colors.card }, containerStyle]}>
            {/* Glow effect */}
            <Animated.View
              style={[
                styles.glow,
                { backgroundColor: colors.streakActive },
                glowStyle,
              ]}
            />

            {/* Flame icon */}
            <Animated.View style={[styles.flameContainer, flameStyle]}>
              <View style={[styles.flameBg, { backgroundColor: colors.streakActive + '30' }]}>
                <Ionicons name="flame" size={64} color={colors.streakActive} />
              </View>
            </Animated.View>

            {/* Emoji */}
            <Text style={styles.emoji}>{emoji}</Text>

            {/* Title */}
            <Text style={[styles.title, { color: colors.streakActive }]}>{title}</Text>

            {/* Streak count */}
            <View style={styles.countContainer}>
              <Text style={[styles.count, { color: colors.text }]}>{streakCount}</Text>
              <Text style={[styles.countLabel, { color: colors.textSecondary }]}>DAY STREAK</Text>
            </View>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>

            {/* Dismiss button */}
            <View style={[styles.dismissButton, { backgroundColor: colors.streakActive }]}>
              <Text style={styles.dismissText}>Keep it going!</Text>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH * 0.85,
    padding: Spacing.xxl,
    borderRadius: Radius.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    transform: [{ scaleX: 2 }],
  },
  flameContainer: {
    marginBottom: Spacing.md,
  },
  flameBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: Spacing.md,
  },
  countContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  count: {
    ...TextStyles.statValueLarge,
    fontSize: 56,
  },
  countLabel: {
    ...TextStyles.statLabel,
    marginTop: Spacing.xs,
  },
  subtitle: {
    ...Typography.subhead,
    marginBottom: Spacing.xl,
  },
  dismissButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.full,
  },
  dismissText: {
    color: '#FFFFFF',
    ...Typography.body,
    fontWeight: '600',
  },
});

export default StreakMilestone;
