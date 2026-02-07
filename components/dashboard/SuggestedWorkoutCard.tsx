import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Card } from '@/components/ui';
import { Typography, TextStyles } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { haptics } from '@/utils/haptics';
import { TemplateWithDetails } from '@/hooks/useWorkoutTemplates';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { usePressScale } from '@/hooks/usePressScale';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SuggestedWorkoutCardProps {
  template: TemplateWithDetails;
  reason: string;
  workedOutToday: boolean;
}

export function SuggestedWorkoutCard({ template, reason, workedOutToday }: SuggestedWorkoutCardProps) {
  const colors = useColors();
  const router = useRouter();
  const { animatedStyle: buttonAnimatedStyle, handlePressIn, handlePressOut } = usePressScale({
    pressedScale: 0.96,
    bounce: false,
  });

  const handleStartWorkout = () => {
    haptics.press();
    router.push(`/workout/${template.id}`);
  };

  if (workedOutToday) {
    return (
      <Card variant="filled" style={styles.container} padding="lg">
        <Animated.View
          entering={FadeInUp.duration(400).springify()}
          style={styles.restState}
        >
          <View style={[styles.restIconContainer, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
          </View>
          <View style={styles.restContent}>
            <Text style={[styles.restTitle, { color: colors.text }]}>
              Great work today!
            </Text>
            <Text style={[styles.restSubtitle, { color: colors.textSecondary }]}>
              Rest up and come back stronger tomorrow
            </Text>
          </View>
        </Animated.View>
      </Card>
    );
  }

  return (
    <Card variant="filled" style={styles.container} padding="none">
      {/* Gradient accent bar */}
      <View style={styles.gradientBar}>
        <View style={[styles.gradientBarInner, { backgroundColor: colors.accent }]} />
      </View>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: colors.accent + '15' }]}>
            <Ionicons name="flash" size={12} color={colors.accent} />
            <Text style={[styles.badgeText, { color: colors.accent }]}>SUGGESTED</Text>
          </View>
        </View>

        {/* Workout Info */}
        <Text style={[styles.templateName, { color: colors.text }]} numberOfLines={2}>
          {template.name}
        </Text>

        <Text style={[styles.reason, { color: colors.textSecondary }]} numberOfLines={2}>
          {reason}
        </Text>

        {/* Exercise Preview */}
        <View style={styles.exercisePreview}>
          <Ionicons name="barbell-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.exerciseCount, { color: colors.textTertiary }]}>
            {template.exerciseCount} exercises
          </Text>
        </View>

        {/* Start Button */}
        <AnimatedPressable
          onPress={handleStartWorkout}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.startButton,
            { backgroundColor: colors.accent },
            buttonAnimatedStyle,
          ]}
        >
          <Text style={styles.startButtonText}>Start Workout</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </AnimatedPressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradientBar: {
    height: 4,
    overflow: 'hidden',
  },
  gradientBarInner: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.small,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  templateName: {
    ...Typography.title2,
    marginBottom: Spacing.xs,
  },
  reason: {
    ...Typography.subhead,
    marginBottom: Spacing.md,
  },
  exercisePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  exerciseCount: {
    ...Typography.footnote,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.large,
    gap: Spacing.sm,
  },
  startButtonText: {
    ...TextStyles.button,
    color: '#FFFFFF',
  },
  restState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  restIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restContent: {
    flex: 1,
  },
  restTitle: {
    ...Typography.title3,
    marginBottom: 2,
  },
  restSubtitle: {
    ...Typography.subhead,
  },
});

export default SuggestedWorkoutCard;
