import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useColors } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { Radius, Layout, Spacing } from '@/constants/Spacing';
import { Shadows } from '@/constants/Shadows';
import { haptics } from '@/utils/haptics';
import { usePressScale } from '@/hooks/usePressScale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  hapticFeedback = true,
  style,
  textStyle,
}: ButtonProps) {
  const colors = useColors();
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale({
    pressedScale: 0.95,
    overshootScale: 1.02,
  });

  const handlePress = () => {
    if (disabled || loading) return;

    // Use standardized haptic feedback based on variant
    if (hapticFeedback) {
      if (variant === 'destructive') {
        haptics.warning();
      } else if (variant === 'primary') {
        haptics.press();
      } else {
        haptics.tap();
      }
    }

    onPress();
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: disabled ? colors.buttonDisabled : colors.primary,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.fillTertiary,
          },
          text: {
            color: disabled ? colors.textTertiary : colors.primary,
          },
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: disabled ? colors.buttonDisabled : colors.error,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: disabled ? colors.textTertiary : colors.primary,
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: disabled ? colors.border : colors.primary,
          },
          text: {
            color: disabled ? colors.textTertiary : colors.primary,
          },
        };
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            height: Layout.buttonHeightSmall,
            paddingHorizontal: Spacing.md,
            borderRadius: Radius.medium,
          },
          text: {
            fontSize: Typography.subhead.fontSize,
          },
        };
      case 'lg':
        return {
          container: {
            height: Layout.buttonHeightLarge,
            paddingHorizontal: Spacing.xxl,
            borderRadius: Radius.large,
          },
          text: {
            fontSize: Typography.body.fontSize,
          },
        };
      case 'md':
      default:
        return {
          container: {
            height: Layout.buttonHeight,
            paddingHorizontal: Spacing.xl,
            borderRadius: Radius.large,
          },
          text: {
            fontSize: Typography.body.fontSize,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyles.text.color}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              variantStyles.text,
              icon && iconPosition === 'left' ? styles.textWithIconLeft : undefined,
              icon && iconPosition === 'right' ? styles.textWithIconRight : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
  },
  textWithIconLeft: {
    marginLeft: Spacing.sm,
  },
  textWithIconRight: {
    marginRight: Spacing.sm,
  },
});

export default Button;
