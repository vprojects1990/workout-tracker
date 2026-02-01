import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useColors } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius, Layout } from '@/constants/Spacing';
import { haptics } from '@/utils/haptics';

interface MacroTargetsFormProps {
  currentTargets: { calories: number; protein: number; carbs: number; fat: number };
  onSave: (targets: { calories: number; protein: number; carbs: number; fat: number }) => void;
  onCancel: () => void;
}

export function MacroTargetsForm({ currentTargets, onSave, onCancel }: MacroTargetsFormProps) {
  const colors = useColors();
  const [calories, setCalories] = useState(currentTargets.calories.toString());
  const [protein, setProtein] = useState(currentTargets.protein.toString());
  const [carbs, setCarbs] = useState(currentTargets.carbs.toString());
  const [fat, setFat] = useState(currentTargets.fat.toString());

  const handleSave = () => {
    haptics.success();
    onSave({
      calories: Math.min(25000, Math.max(0, Number(calories) || 0)),
      protein: Math.min(2000, Math.max(0, Number(protein) || 0)),
      carbs: Math.min(2000, Math.max(0, Number(carbs) || 0)),
      fat: Math.min(1000, Math.max(0, Number(fat) || 0)),
    });
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.separator },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Daily Macro Targets</Text>

      <Text style={[styles.label, { color: colors.textSecondary }]}>Calories (kcal)</Text>
      <TextInput
        style={inputStyle}
        value={calories}
        onChangeText={setCalories}
        keyboardType="numeric"
        placeholderTextColor={colors.inputPlaceholder}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Protein (g)</Text>
      <TextInput
        style={inputStyle}
        value={protein}
        onChangeText={setProtein}
        keyboardType="numeric"
        placeholderTextColor={colors.inputPlaceholder}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Carbs (g)</Text>
      <TextInput
        style={inputStyle}
        value={carbs}
        onChangeText={setCarbs}
        keyboardType="numeric"
        placeholderTextColor={colors.inputPlaceholder}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Fat (g)</Text>
      <TextInput
        style={inputStyle}
        value={fat}
        onChangeText={setFat}
        keyboardType="numeric"
        placeholderTextColor={colors.inputPlaceholder}
      />

      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          style={[styles.button, { backgroundColor: colors.buttonSecondary }]}
        >
          <Text style={[styles.buttonText, { color: colors.buttonSecondaryText }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
        >
          <Text style={[styles.buttonText, { color: colors.buttonPrimaryText }]}>Save Targets</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  title: {
    ...Typography.title2,
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.subhead,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  input: {
    ...Typography.body,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: Layout.inputHeight,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.medium,
    minHeight: Layout.buttonHeight,
  },
  buttonText: {
    ...Typography.headline,
  },
});
