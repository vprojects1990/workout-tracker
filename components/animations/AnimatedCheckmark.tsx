import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedCheckmarkProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
  onComplete?: () => void;
  delay?: number;
}

export function AnimatedCheckmark({
  size = 32,
  color,
  backgroundColor,
  onComplete,
  delay = 0,
}: AnimatedCheckmarkProps) {
  const colors = useColors();
  const checkColor = color || '#FFFFFF';
  const bgColor = backgroundColor || colors.success;

  const scale = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const rotation = useSharedValue(-45);

  useEffect(() => {
    // Background circle animation
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.15, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 150 })
      )
    );

    // Checkmark animation (delayed after circle)
    checkScale.value = withDelay(
      delay + 150,
      withSequence(
        withSpring(1.2, { damping: 6, stiffness: 250 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      )
    );

    // Subtle rotation
    rotation.value = withDelay(
      delay,
      withTiming(0, { duration: 300, easing: Easing.out(Easing.back(1.5)) })
    );

    // Callback
    if (onComplete) {
      const timeout = setTimeout(() => {
        onComplete();
      }, delay + 500);
      return () => clearTimeout(timeout);
    }
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
        containerStyle,
      ]}
    >
      <Animated.View style={checkStyle}>
        <Ionicons name="checkmark" size={size * 0.6} color={checkColor} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AnimatedCheckmark;
