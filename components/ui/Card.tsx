import React from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useColors } from '@/components/Themed';
import { Radius, Spacing } from '@/constants/Spacing';
import { Shadows, ShadowStyles } from '@/constants/Shadows';
import { haptics } from '@/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = 'default' | 'elevated' | 'filled' | 'outline';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  hapticFeedback?: boolean;
  style?: StyleProp<ViewStyle>;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// Spring configurations for satisfying press animations
const SPRING_CONFIGS = {
  pressIn: {
    damping: 15,
    stiffness: 350,
    mass: 0.8,
  },
  pressOut: {
    damping: 12,
    stiffness: 180,
    mass: 0.8,
  },
  bounce: {
    damping: 10,
    stiffness: 300,
    mass: 0.6,
  },
};

export function Card({
  children,
  variant = 'default',
  onPress,
  hapticFeedback = true,
  style,
  padding = 'md',
}: CardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      // Quick, responsive press down
      scale.value = withSpring(0.97, SPRING_CONFIGS.pressIn);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      // Bounce back with subtle overshoot for satisfying release
      scale.value = withSequence(
        withSpring(1.01, SPRING_CONFIGS.bounce),
        withSpring(1, SPRING_CONFIGS.pressOut)
      );
    }
  };

  const handlePress = () => {
    if (!onPress) return;
    if (hapticFeedback) {
      haptics.tap();
    }
    onPress();
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.cardElevated,
          ...ShadowStyles.cardElevated,
        };
      case 'filled':
        return {
          backgroundColor: colors.fillTertiary,
        };
      case 'outline':
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.separator,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.card,
          ...ShadowStyles.card,
        };
    }
  };

  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: Spacing.sm };
      case 'lg':
        return { padding: Spacing.xl };
      case 'md':
      default:
        return { padding: Spacing.lg };
    }
  };

  const variantStyles = getVariantStyles();
  const paddingStyles = getPaddingStyles();

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.container,
          variantStyles,
          paddingStyles,
          animatedStyle,
          style,
        ]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        variantStyles,
        paddingStyles,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
});

export default Card;
