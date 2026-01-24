import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { Radius, Spacing } from '@/constants/Spacing';

interface SegmentedControlProps<T extends string> {
  options: { label: string; value: T }[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  hapticFeedback?: boolean;
  style?: ViewStyle;
}

export function SegmentedControl<T extends string>({
  options,
  selectedValue,
  onValueChange,
  hapticFeedback = true,
  style,
}: SegmentedControlProps<T>) {
  const colors = useColors();
  const selectedIndex = options.findIndex((opt) => opt.value === selectedValue);

  const handleSelect = (value: T) => {
    if (value === selectedValue) return;
    if (hapticFeedback) {
      Haptics.selectionAsync();
    }
    onValueChange(value);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.fillTertiary },
        style,
      ]}
    >
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;
        return (
          <Pressable
            key={option.value}
            onPress={() => handleSelect(option.value)}
            style={[
              styles.option,
              isSelected && [
                styles.selectedOption,
                { backgroundColor: colors.card },
              ],
            ]}
          >
            <Text
              style={[
                styles.optionText,
                { color: isSelected ? colors.text : colors.textSecondary },
                isSelected && styles.selectedOptionText,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radius.medium,
    padding: 2,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.small,
  },
  selectedOption: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    ...Typography.footnote,
    fontWeight: '500',
  },
  selectedOptionText: {
    fontWeight: '600',
  },
});

export default SegmentedControl;
