import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Typography, TextStyles } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.55;

interface RestTimerProps {
  seconds: number;
  totalSeconds: number;
  onDismiss: () => void;
  onAddTime: (seconds: number) => void;
  onSkip: () => void;
  nextExerciseName?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ':' + secs.toString().padStart(2, '0');
}

export function RestTimer({
  seconds,
  totalSeconds,
  onDismiss,
  onAddTime,
  onSkip,
  nextExerciseName,
}: RestTimerProps) {
  const colors = useColors();
  const progress = useSharedValue(seconds / totalSeconds);

  useEffect(() => {
    progress.value = withTiming(seconds / totalSeconds, {
      duration: 1000,
      easing: Easing.linear,
    });
  }, [seconds, totalSeconds]);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (seconds <= 5 && seconds > 0) {
      pulseScale.value = withSpring(1.05, { damping: 10, stiffness: 200 });
      setTimeout(() => {
        pulseScale.value = withSpring(1, { damping: 10, stiffness: 200 });
      }, 200);
    }
  }, [seconds]);

  const timerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  const isLowTime = seconds <= 10;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      <Pressable style={styles.dismissArea} onPress={onDismiss}>
        <BlurView intensity={95} tint="dark" style={styles.blur}>
          <View style={styles.content}>
            {/* Timer circle */}
            <Animated.View style={[styles.circleContainer, timerStyle]}>
              <View style={[styles.circleOuter, { borderColor: colors.fillTertiary }]}>
                {/* Progress ring using border trick */}
                <View
                  style={[
                    styles.circleProgress,
                    {
                      borderColor: isLowTime ? colors.warning : colors.accent,
                      opacity: 0.3,
                    },
                  ]}
                />
                <View style={styles.circleInner}>
                  <Text style={[styles.restLabel, { color: colors.textTertiary }]}>REST</Text>
                  <Text
                    style={[
                      styles.timerText,
                      { color: isLowTime ? colors.warning : colors.text },
                    ]}
                  >
                    {formatTime(seconds)}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.fillTertiary }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { backgroundColor: isLowTime ? colors.warning : colors.accent },
                    progressStyle,
                  ]}
                />
              </View>
            </View>

            {/* Next exercise preview */}
            {nextExerciseName && (
              <View style={styles.nextExercise}>
                <Text style={[styles.nextLabel, { color: colors.textTertiary }]}>UP NEXT</Text>
                <Text style={[styles.nextName, { color: colors.text }]} numberOfLines={1}>
                  {nextExerciseName}
                </Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.fillTertiary }]}
                onPress={() => onAddTime(30)}
              >
                <Ionicons name="add" size={20} color={colors.text} />
                <Text style={[styles.actionText, { color: colors.text }]}>+30s</Text>
              </Pressable>

              <Pressable
                style={[styles.skipButton, { backgroundColor: colors.accent }]}
                onPress={onSkip}
              >
                <Ionicons name="play-forward" size={20} color="#FFFFFF" />
                <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Skip</Text>
              </Pressable>
            </View>

            <Text style={[styles.dismissHint, { color: colors.textQuaternary }]}>
              Tap anywhere to minimize
            </Text>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  dismissArea: {
    flex: 1,
  },
  blur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOuter: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleProgress: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 6,
  },
  circleInner: {
    alignItems: 'center',
  },
  restLabel: {
    ...TextStyles.statLabel,
    marginBottom: Spacing.xs,
  },
  timerText: {
    ...TextStyles.timerDisplay,
  },
  progressContainer: {
    width: '80%',
    marginTop: Spacing.xl,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    transformOrigin: 'left',
  },
  nextExercise: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
  nextLabel: {
    ...TextStyles.statLabel,
    marginBottom: Spacing.xs,
  },
  nextName: {
    ...Typography.title3,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xxl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.large,
    gap: Spacing.xs,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.large,
    gap: Spacing.xs,
  },
  actionText: {
    ...Typography.body,
    fontWeight: '600',
  },
  dismissHint: {
    ...Typography.footnote,
    marginTop: Spacing.xxl,
  },
});

export default RestTimer;
