import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { Spacing, Layout } from '@/constants/Spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  hapticFeedback?: boolean;
  destructive?: boolean;
  style?: ViewStyle;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightElement,
  showChevron = true,
  onPress,
  hapticFeedback = true,
  destructive = false,
  style,
}: ListItemProps) {
  const colors = useColors();
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (onPress) {
      opacity.value = withTiming(0.7, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      opacity.value = withTiming(1, { duration: 100 });
    }
  };

  const handlePress = () => {
    if (!onPress) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const titleColor = destructive ? colors.error : colors.text;

  const content = (
    <View style={[styles.container, style]}>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: titleColor }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      {showChevron && onPress && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textTertiary}
          style={styles.chevron}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Layout.listItemMinHeight,
    paddingVertical: Layout.listItemPaddingVertical,
    paddingHorizontal: Layout.listItemPaddingHorizontal,
  },
  leftIcon: {
    marginRight: Spacing.md,
    width: Layout.iconSizeLarge,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...Typography.body,
  },
  subtitle: {
    ...Typography.footnote,
    marginTop: 2,
  },
  rightElement: {
    marginLeft: Spacing.md,
  },
  chevron: {
    marginLeft: Spacing.sm,
  },
});

export default ListItem;
