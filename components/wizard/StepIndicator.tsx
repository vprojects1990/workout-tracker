import { StyleSheet } from 'react-native';
import { View, Text, useColors } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';

type StepIndicatorProps = {
  currentStep: 1 | 2 | 3;
  steps: string[];
};

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <View key={stepNumber} style={styles.stepWrapper}>
            <View
              style={[
                styles.dot,
                { backgroundColor: colors.backgroundSecondary },
                isActive && { backgroundColor: colors.primary },
                isCompleted && { backgroundColor: colors.success },
              ]}
            >
              {isCompleted ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    { color: colors.textTertiary },
                    (isActive || isCompleted) && styles.stepNumberActive,
                  ]}
                >
                  {stepNumber}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.label,
                { color: colors.textTertiary },
                isActive && { color: colors.text, fontWeight: '600' },
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: Spacing.lg,
    gap: Spacing.xl,
    backgroundColor: 'transparent',
  },
  stepWrapper: {
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'transparent',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    ...Typography.subhead,
    fontWeight: '600',
  },
  stepNumberActive: {
    color: '#fff',
  },
  label: {
    ...Typography.caption1,
    textAlign: 'center',
    maxWidth: 80,
  },
});
