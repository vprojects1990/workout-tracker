import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';

export function NutritionEmptyState() {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Ionicons name="restaurant-outline" size={48} color={colors.systemGray} />
      <Text style={[styles.title, { color: colors.text }]}>No meals logged</Text>
      <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
        Tap + to log your first meal
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.section,
    gap: Spacing.sm,
  },
  title: {
    ...Typography.title3,
    marginTop: Spacing.md,
  },
  subtitle: {
    ...Typography.subhead,
  },
});
