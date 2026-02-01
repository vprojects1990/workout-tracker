import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useColors } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { getMealPhotoUri } from '@/utils/mealImage';
import type { MealLog } from '@/db/schema';

interface MealCardProps {
  meal: MealLog;
  onPress: () => void;
}

export function MealCard({ meal, onPress }: MealCardProps) {
  const colors = useColors();

  return (
    <Pressable
      testID="meal-card"
      onPress={onPress}
      style={[styles.container, { backgroundColor: colors.card }]}
    >
      {meal.photoFilename && (
        <Image
          testID="meal-photo"
          source={{ uri: getMealPhotoUri(meal.photoFilename) }}
          style={styles.photo}
        />
      )}
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {meal.name}
        </Text>
        <View style={styles.macros}>
          <Text style={[styles.macroPill, { color: colors.accent }]}>{meal.calories} kcal</Text>
          <Text style={[styles.macroPill, { color: colors.systemBlue }]}>{Math.round(meal.protein)}g P</Text>
          <Text style={[styles.macroPill, { color: colors.systemOrange }]}>{Math.round(meal.carbs)}g C</Text>
          <Text style={[styles.macroPill, { color: colors.systemPurple }]}>{Math.round(meal.fat)}g F</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: Radius.large,
    alignItems: 'center',
  },
  photo: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    ...Typography.headline,
    marginBottom: Spacing.xs,
  },
  macros: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  macroPill: {
    ...Typography.caption1,
    fontWeight: '600',
  },
});
