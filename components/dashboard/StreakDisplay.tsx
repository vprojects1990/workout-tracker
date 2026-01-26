import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { TextStyles } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
} from 'react-native-reanimated';

interface StreakDisplayProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakDisplay({ streak, size = 'md' }: StreakDisplayProps) {
  const colors = useColors();
  const scale = useSharedValue(0);
  const flameScale = useSharedValue(1);

  const isActive = streak > 0;
  const flameColor = isActive ? colors.streakActive : colors.textQuaternary;

  // Calculate flame intensity based on streak length
  const getFlameIntensity = () => {
    if (streak === 0) return 0;
    if (streak < 3) return 1;
    if (streak < 7) return 2;
    if (streak < 14) return 3;
    if (streak < 30) return 4;
    return 5;
  };

  const intensity = getFlameIntensity();

  // Size configurations
  const sizeConfig = {
    sm: { iconSize: 16, fontSize: TextStyles.statValueSmall },
    md: { iconSize: 24, fontSize: TextStyles.statValue },
    lg: { iconSize: 32, fontSize: TextStyles.streakCount },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    // Animate in on mount
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // Pulse animation for active streak
    if (isActive) {
      flameScale.value = withSequence(
        withDelay(500, withSpring(1.15, { damping: 8, stiffness: 200 })),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
    }
  }, [streak]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0, 1], [0, 1]),
  }));

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.flameContainer, flameStyle]}>
        {/* Multiple flame layers for intensity effect */}
        {intensity >= 3 && (
          <View style={[styles.flameGlow, { backgroundColor: flameColor + '30' }]} />
        )}
        <Ionicons
          name={isActive ? 'flame' : 'flame-outline'}
          size={config.iconSize}
          color={flameColor}
        />
      </Animated.View>
      <Text style={[config.fontSize, styles.streakText, { color: colors.text }]}>
        {streak}
      </Text>
      <Text style={[styles.label, { color: colors.textTertiary }]}>
        {streak === 1 ? 'day' : 'days'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  streakText: {
    marginTop: Spacing.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default StreakDisplay;
