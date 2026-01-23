import { StyleSheet } from 'react-native';
import { View, Text } from '@/components/Themed';

type StepIndicatorProps = {
  currentStep: 1 | 2 | 3;
  steps: string[];
};

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
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
                isActive && styles.dotActive,
                isCompleted && styles.dotCompleted,
              ]}
            >
              {isCompleted ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : (
                <Text style={[styles.stepNumber, (isActive || isCompleted) && styles.stepNumberActive]}>
                  {stepNumber}
                </Text>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
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
    paddingVertical: 16,
    gap: 24,
    backgroundColor: 'transparent',
  },
  stepWrapper: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotActive: {
    backgroundColor: '#007AFF',
  },
  dotCompleted: {
    backgroundColor: '#34C759',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
  },
  stepNumberActive: {
    color: '#fff',
    opacity: 1,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    maxWidth: 80,
  },
  labelActive: {
    opacity: 1,
    fontWeight: '600',
  },
});
