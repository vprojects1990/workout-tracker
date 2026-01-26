import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Spacing, Radius } from '@/constants/Spacing';
import Animated, {
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';

interface WeekCalendarProps {
  workoutDays: number[]; // Array of day indices (0 = Monday, 6 = Sunday) that had workouts
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeekCalendar({ workoutDays }: WeekCalendarProps) {
  const colors = useColors();

  // Get current day of week (0 = Monday in our system)
  const today = new Date();
  const currentDay = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

  return (
    <View style={styles.container}>
      {DAY_LABELS.map((label, index) => {
        const hasWorkout = workoutDays.includes(index);
        const isToday = index === currentDay;
        const isPast = index < currentDay;

        return (
          <Animated.View
            key={index}
            entering={FadeIn.delay(index * 50).duration(300)}
            style={styles.dayContainer}
          >
            <Text
              style={[
                styles.dayLabel,
                { color: isToday ? colors.text : colors.textTertiary },
                isToday && styles.todayLabel,
              ]}
            >
              {label}
            </Text>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: hasWorkout
                    ? colors.success
                    : isPast
                    ? colors.fillTertiary
                    : colors.fillQuaternary,
                },
                isToday && styles.todayDot,
                isToday && !hasWorkout && { borderColor: colors.accent, borderWidth: 2 },
              ]}
            >
              {hasWorkout && (
                <View style={[styles.dotInner, { backgroundColor: colors.success }]} />
              )}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  dayContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  todayLabel: {
    fontWeight: '700',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default WeekCalendar;
