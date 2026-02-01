import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '@/components/Themed';
import { Typography, TextStyles } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import type { MacroTotals } from '@/hooks/useMealTracking';

interface MacroRingsProps {
  totals: MacroTotals;
  targets: MacroTotals;
}

type MacroKey = keyof MacroTotals;

const RING_SIZE = 64;
const STROKE_WIDTH = 6;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function MacroRing({
  current,
  target,
  color,
  label,
  unit,
  bgColor,
}: {
  current: number;
  target: number;
  color: string;
  label: string;
  unit: string;
  bgColor: string;
}) {
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <View style={styles.ringItem}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        {/* Background ring */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={bgColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Progress ring */}
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      <Text style={[styles.macroLabel, { color }]}>{label}</Text>
      <View style={styles.macroValues}>
        <Text style={[styles.currentValue]}>{Math.round(current)}</Text>
        <Text style={[styles.targetValue]}>/ {Math.round(target)} {unit}</Text>
      </View>
    </View>
  );
}

export function MacroRings({ totals, targets }: MacroRingsProps) {
  const colors = useColors();

  const macros: { key: MacroKey; label: string; color: string; unit: string }[] = [
    { key: 'calories', label: 'Calories', color: colors.accent, unit: 'kcal' },
    { key: 'protein', label: 'Protein', color: colors.systemBlue, unit: 'g' },
    { key: 'carbs', label: 'Carbs', color: colors.systemOrange, unit: 'g' },
    { key: 'fat', label: 'Fat', color: colors.systemPurple, unit: 'g' },
  ];

  return (
    <View style={styles.container}>
      {macros.map(({ key, label, color, unit }) => (
        <MacroRing
          key={key}
          current={totals[key]}
          target={targets[key]}
          color={color}
          label={label}
          unit={unit}
          bgColor={colors.fillTertiary}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  ringItem: {
    alignItems: 'center',
  },
  macroLabel: {
    ...Typography.caption1,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  macroValues: {
    alignItems: 'center',
    marginTop: 2,
  },
  currentValue: {
    ...TextStyles.statValueSmall,
    fontSize: 16,
    lineHeight: 20,
  },
  targetValue: {
    ...Typography.caption2,
    opacity: 0.6,
  },
});
