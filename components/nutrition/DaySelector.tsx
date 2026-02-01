import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { haptics } from '@/utils/haptics';
import { getWeekdaysOfWeek, formatDateKey, getDayLabel, isFutureDate, isToday, canLogMeal } from '@/utils/mealDates';
import type { WeekDaySummary, AdherenceStatus } from '@/hooks/useMealTracking';

interface DaySelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  weekOffset: number;
  onWeekChange: (offset: number) => void;
  weekSummary?: WeekDaySummary[];
}

const STATUS_COLORS: Record<AdherenceStatus, string> = {
  'on-target': '#06D6A0',
  'close': '#FF9500',
  'off-target': '#E94560',
  'over': '#E94560',
  'no-data': 'transparent',
};

export function DaySelector({
  selectedDate,
  onSelectDate,
  weekOffset,
  onWeekChange,
  weekSummary,
}: DaySelectorProps) {
  const colors = useColors();
  const weekdays = getWeekdaysOfWeek(weekOffset);
  const selectedKey = formatDateKey(selectedDate);
  const nextWeekHasLoggableDay = getWeekdaysOfWeek(weekOffset + 1).some(canLogMeal);

  const handleDayPress = (date: Date) => {
    if (isFutureDate(date)) return;
    haptics.tap();
    onSelectDate(date);
  };

  const summaryMap = new Map(weekSummary?.map(s => [s.date, s]));

  return (
    <View style={styles.container}>
      <View style={styles.weekNav}>
        <Pressable testID="week-prev" onPress={() => { haptics.tap(); onWeekChange(weekOffset - 1); }} accessibilityLabel="Previous week" accessibilityRole="button">
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.daysRow}>
          {weekdays.map((date, i) => {
            const key = formatDateKey(date);
            const isSelected = key === selectedKey;
            const future = isFutureDate(date);
            const today = isToday(date);
            const summary = summaryMap.get(key);
            const statusColor = summary ? STATUS_COLORS[summary.status] : 'transparent';

            return (
              <Pressable
                key={key}
                testID={`day-button-${i}`}
                onPress={() => handleDayPress(date)}
                disabled={future}
                accessibilityLabel={`${getDayLabel(date)} ${date.getDate()}`}
                accessibilityRole="button"
                style={[
                  styles.dayButton,
                  isSelected && { backgroundColor: colors.accent },
                  future && styles.dayDisabled,
                ]}
              >
                <Text style={[
                  styles.dayLabel,
                  { color: isSelected ? '#FFF' : future ? colors.textTertiary : colors.textSecondary },
                ]}>
                  {getDayLabel(date)}
                </Text>
                <Text style={[
                  styles.dayNumber,
                  { color: isSelected ? '#FFF' : future ? colors.textTertiary : colors.text },
                  today && !isSelected && { color: colors.accent },
                ]}>
                  {date.getDate()}
                </Text>
                {statusColor !== 'transparent' && (
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                )}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          testID="week-next"
          onPress={() => { haptics.tap(); onWeekChange(weekOffset + 1); }}
          disabled={!nextWeekHasLoggableDay}
          accessibilityLabel="Next week"
          accessibilityRole="button"
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={!nextWeekHasLoggableDay ? colors.textTertiary : colors.text}
          />
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
  daysRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dayButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.medium,
    minWidth: 48,
  },
  dayDisabled: {
    opacity: 0.4,
  },
  dayLabel: {
    ...Typography.caption2,
    fontWeight: '500',
    marginBottom: 2,
  },
  dayNumber: {
    ...Typography.headline,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
});
