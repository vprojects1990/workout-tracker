import { useState } from 'react';
import { StyleSheet, Pressable, TextInput, Modal, Alert } from 'react-native';
import { View, Text, useColors } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export type WorkoutDay = {
  id: string;
  dayOfWeek: number; // 0-6
  suffix: string; // "Upper", "Push", etc.
  displayName: string; // "Monday - Upper"
};

type DayPickerProps = {
  workoutDays: WorkoutDay[];
  onAddDay: (day: WorkoutDay) => void;
  onRemoveDay: (dayId: string) => void;
};

export function DayPicker({ workoutDays, onAddDay, onRemoveDay }: DayPickerProps) {
  const colors = useColors();

  const [showSuffixModal, setShowSuffixModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [suffix, setSuffix] = useState('');

  const handleDayPress = (dayIndex: number) => {
    const existingDay = workoutDays.find(d => d.dayOfWeek === dayIndex);
    if (existingDay) {
      return;
    }
    Haptics.selectionAsync();
    setSelectedDayIndex(dayIndex);
    setSuffix('');
    setShowSuffixModal(true);
  };

  const handleConfirmSuffix = () => {
    if (selectedDayIndex === null) return;

    const trimmedSuffix = suffix.trim();
    if (!trimmedSuffix) {
      Alert.alert('Required', 'Please enter a workout name (e.g., "Upper", "Push")');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const displayName = `${FULL_DAYS[selectedDayIndex]} - ${trimmedSuffix}`;
    const newDay: WorkoutDay = {
      id: `day-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      dayOfWeek: selectedDayIndex,
      suffix: trimmedSuffix,
      displayName,
    };

    onAddDay(newDay);
    setShowSuffixModal(false);
    setSelectedDayIndex(null);
    setSuffix('');
  };

  const isDaySelected = (dayIndex: number) => {
    return workoutDays.some(d => d.dayOfWeek === dayIndex);
  };

  const sortedDays = [...workoutDays].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <View style={styles.container}>
      {/* Day buttons */}
      <View style={styles.daysRow}>
        {DAYS.map((day, index) => {
          const isSelected = isDaySelected(index);
          return (
            <Pressable
              key={day}
              style={[
                styles.dayButton,
                { backgroundColor: isSelected ? colors.primary : colors.backgroundSecondary },
              ]}
              onPress={() => handleDayPress(index)}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: isSelected ? '#fff' : colors.text },
                ]}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Added days list */}
      {sortedDays.length > 0 && (
        <View style={styles.addedDaysList}>
          <Text style={[styles.addedDaysTitle, { color: colors.textSecondary }]}>Workout Days</Text>
          {sortedDays.map(day => (
            <View
              key={day.id}
              style={[styles.addedDayRow, { backgroundColor: colors.backgroundSecondary }]}
            >
              <Text style={[styles.addedDayName, { color: colors.text }]}>{day.displayName}</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onRemoveDay(day.id);
                }}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={22} color={colors.error} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Suffix input modal */}
      <Modal visible={showSuffixModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectedDayIndex !== null ? FULL_DAYS[selectedDayIndex] : ''}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Enter workout name
            </Text>
            <TextInput
              style={[styles.suffixInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
              value={suffix}
              onChangeText={setSuffix}
              placeholder="e.g., Upper, Push, Legs"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              onSubmitEditing={handleConfirmSuffix}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="secondary"
                size="md"
                onPress={() => {
                  setShowSuffixModal(false);
                  setSelectedDayIndex(null);
                  setSuffix('');
                }}
                style={styles.modalButton}
              />
              <Button
                title="Add"
                variant="primary"
                size="md"
                onPress={handleConfirmSuffix}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
    backgroundColor: 'transparent',
  },
  dayButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.medium,
    alignItems: 'center',
  },
  dayText: {
    ...Typography.subhead,
    fontWeight: '500',
  },
  addedDaysList: {
    marginTop: Spacing.xl,
    backgroundColor: 'transparent',
  },
  addedDaysTitle: {
    ...Typography.subhead,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  addedDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.medium,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  addedDayName: {
    ...Typography.body,
    fontWeight: '500',
  },
  removeButton: {
    padding: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    borderRadius: Radius.large,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    ...Typography.title2,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    ...Typography.subhead,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  suffixInput: {
    padding: Spacing.md,
    borderRadius: Radius.medium,
    ...Typography.body,
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: 'transparent',
  },
  modalButton: {
    flex: 1,
  },
});
