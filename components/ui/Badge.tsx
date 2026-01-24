import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useColors } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { Radius, Spacing } from '@/constants/Spacing';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}: BadgeProps) {
  const colors = useColors();

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.primary,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'success':
        return {
          container: {
            backgroundColor: colors.success,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'warning':
        return {
          container: {
            backgroundColor: colors.warning,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'error':
        return {
          container: {
            backgroundColor: colors.error,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'info':
        return {
          container: {
            backgroundColor: colors.systemTeal,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'default':
      default:
        return {
          container: {
            backgroundColor: colors.fillTertiary,
          },
          text: {
            color: colors.text,
          },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: Spacing.xs,
            paddingVertical: 2,
            borderRadius: Radius.xs,
          },
          text: {
            fontSize: Typography.caption2.fontSize,
          },
        };
      case 'md':
      default:
        return {
          container: {
            paddingHorizontal: Spacing.sm,
            paddingVertical: Spacing.xs,
            borderRadius: Radius.small,
          },
          text: {
            fontSize: Typography.caption1.fontSize,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          sizeStyles.text,
          variantStyles.text,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});

export default Badge;
