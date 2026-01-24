import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Card } from '@/components/ui';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TemplateWithDetails } from '@/hooks/useWorkoutTemplates';

interface SuggestedWorkoutCardProps {
  template: TemplateWithDetails;
  reason: string;
  workedOutToday: boolean;
}

export function SuggestedWorkoutCard({ template, reason, workedOutToday }: SuggestedWorkoutCardProps) {
  const colors = useColors();
  const router = useRouter();

  const handleStartWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/workout/${template.id}`);
  };

  if (workedOutToday) {
    return (
      <Card variant="default" style={styles.container} padding="lg">
        <View style={styles.restState}>
          <View style={[styles.restIconContainer, { backgroundColor: colors.success + '15' }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          </View>
          <View style={styles.restContent}>
            <Text style={[styles.restTitle, { color: colors.text }]}>Great work today!</Text>
            <Text style={[styles.restSubtitle, { color: colors.textSecondary }]}>
              Rest up and come back stronger
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card variant="default" style={styles.container} padding="lg">
      <View style={styles.header}>
        <Ionicons name="fitness" size={16} color={colors.primary} />
        <Text style={[styles.headerText, { color: colors.primary }]}>SUGGESTED NEXT</Text>
      </View>

      <Text style={[styles.templateName, { color: colors.text }]} numberOfLines={1}>
        {template.name}
      </Text>

      <Text style={[styles.reason, { color: colors.textSecondary }]}>
        {reason}
      </Text>

      <Pressable
        onPress={handleStartWorkout}
        style={({ pressed }) => [
          styles.startButton,
          { backgroundColor: colors.primary },
          pressed && styles.startButtonPressed,
        ]}
      >
        <Text style={styles.startButtonText}>Start Workout</Text>
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </Pressable>
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
  templateName: {
    ...Typography.title3,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  reason: {
    ...Typography.footnote,
    marginBottom: Spacing.lg,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.medium,
    gap: Spacing.sm,
  },
  startButtonPressed: {
    opacity: 0.8,
  },
  startButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  restState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  restIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restContent: {
    flex: 1,
  },
  restTitle: {
    ...Typography.headline,
  },
  restSubtitle: {
    ...Typography.footnote,
    marginTop: 2,
  },
});

export default SuggestedWorkoutCard;
