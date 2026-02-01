import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useColors } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import type { FoodItem } from '@/utils/foodSearch';

interface FoodResultRowProps {
  food: FoodItem;
  onSelect: (food: FoodItem) => void;
}

export function FoodResultRow({ food, onSelect }: FoodResultRowProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => onSelect(food)}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.separator }]}
      accessibilityRole="button"
      accessibilityLabel={`${food.description}, ${Math.round(food.caloriesPer100g)} calories per 100 grams`}
    >
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
        {food.description}
      </Text>
      <View style={[styles.badge, { backgroundColor: colors.accent + '18' }]}>
        <Text style={[styles.badgeText, { color: colors.accent }]}>
          {Math.round(food.caloriesPer100g)} cal/100g
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  name: {
    ...Typography.body,
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.small,
  },
  badgeText: {
    ...Typography.caption1,
    fontWeight: '600',
  },
});
