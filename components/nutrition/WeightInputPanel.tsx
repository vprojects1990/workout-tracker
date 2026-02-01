import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useColors } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius, Layout } from '@/constants/Spacing';
import { estimateMacros, type FoodItem, type EstimatedMacros } from '@/utils/foodSearch';
import { haptics } from '@/utils/haptics';

interface WeightInputPanelProps {
  food: FoodItem;
  onUse: (macros: EstimatedMacros) => void;
  onBack: () => void;
}

export function WeightInputPanel({ food, onUse, onBack }: WeightInputPanelProps) {
  const colors = useColors();
  const [weightText, setWeightText] = useState('100');

  const weight = Number(weightText) || 0;
  const macros = useMemo(() => estimateMacros(food, weight), [food, weight]);

  const handleUse = () => {
    if (weight <= 0) return;
    haptics.success();
    onUse(macros);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back to results">
        <Text style={[styles.backText, { color: colors.accent }]}>Back to results</Text>
      </Pressable>

      <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={2}>
        {food.description}
      </Text>

      <View style={styles.weightRow}>
        <TextInput
          style={[styles.weightInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.separator }]}
          value={weightText}
          onChangeText={setWeightText}
          keyboardType="numeric"
          placeholder="Weight"
          placeholderTextColor={colors.inputPlaceholder}
          selectTextOnFocus
          accessibilityLabel="Weight in grams"
        />
        <Text style={[styles.unit, { color: colors.textSecondary }]}>grams</Text>
      </View>

      <View style={[styles.preview, { backgroundColor: colors.backgroundTertiary }]}>
        <MacroPreviewRow label="Calories" value={`${macros.calories}`} color={colors.accent} />
        <MacroPreviewRow label="Protein" value={`${macros.protein}g`} color={colors.systemBlue} />
        <MacroPreviewRow label="Carbs" value={`${macros.carbs}g`} color={colors.systemOrange} />
        <MacroPreviewRow label="Fat" value={`${macros.fat}g`} color={colors.systemPurple} />
      </View>

      <Pressable
        onPress={handleUse}
        disabled={weight <= 0}
        style={[
          styles.useButton,
          { backgroundColor: weight > 0 ? colors.buttonPrimary : colors.buttonDisabled },
        ]}
        accessibilityRole="button"
      >
        <Text style={[styles.useButtonText, { color: weight > 0 ? colors.buttonPrimaryText : colors.buttonDisabledText }]}>
          Use
        </Text>
      </Pressable>
    </View>
  );
}

function MacroPreviewRow({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.previewRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.previewValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  backText: {
    ...Typography.subhead,
  },
  foodName: {
    ...Typography.headline,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  weightInput: {
    ...Typography.body,
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: Layout.inputHeight,
  },
  unit: {
    ...Typography.body,
  },
  preview: {
    borderRadius: Radius.medium,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewLabel: {
    ...Typography.subhead,
    flex: 1,
  },
  previewValue: {
    ...Typography.headline,
  },
  useButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.medium,
    minHeight: Layout.buttonHeight,
  },
  useButtonText: {
    ...Typography.headline,
  },
});
