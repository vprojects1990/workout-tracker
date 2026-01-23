import { useState } from 'react';
import { StyleSheet, Pressable, TextInput, Modal, Alert } from 'react-native';
import { View, Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';

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
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';
  const inputStyle = colorScheme === 'dark' ? styles.inputDark : styles.inputLight;

  const [showSuffixModal, setShowSuffixModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [suffix, setSuffix] = useState('');

  const handleDayPress = (dayIndex: number) => {
    // Check if day is already added
    const existingDay = workoutDays.find(d => d.dayOfWeek === dayIndex);
    if (existingDay) {
      // Already added, do nothing (user can remove via the list)
      return;
    }
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

    const displayName = `${FULL_DAYS[selectedDayIndex]} - ${trimmedSuffix}`;
    const newDay: WorkoutDay = {
      id: `day-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  // Sort workout days by dayOfWeek for display
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
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
              onPress={() => handleDayPress(index)}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Added days list */}
      {sortedDays.length > 0 && (
        <View style={styles.addedDaysList}>
          <Text style={styles.addedDaysTitle}>Workout Days</Text>
          {sortedDays.map(day => (
            <View key={day.id} style={styles.addedDayRow}>
              <Text style={styles.addedDayName}>{day.displayName}</Text>
              <Pressable onPress={() => onRemoveDay(day.id)} style={styles.removeButton}>
                <Ionicons name="close-circle" size={22} color="#ff4444" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Suffix input modal */}
      <Modal visible={showSuffixModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, colorScheme === 'dark' && styles.modalContentDark]}>
            <Text style={styles.modalTitle}>
              {selectedDayIndex !== null ? FULL_DAYS[selectedDayIndex] : ''}
            </Text>
            <Text style={styles.modalSubtitle}>Enter workout name</Text>
            <TextInput
              style={[styles.suffixInput, inputStyle]}
              value={suffix}
              onChangeText={setSuffix}
              placeholder="e.g., Upper, Push, Legs"
              placeholderTextColor="#999"
              autoFocus
              onSubmitEditing={handleConfirmSuffix}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowSuffixModal(false);
                  setSelectedDayIndex(null);
                  setSuffix('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmButton} onPress={handleConfirmSuffix}>
                <Text style={styles.modalConfirmText}>Add</Text>
              </Pressable>
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
    gap: 6,
    backgroundColor: 'transparent',
  },
  dayButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  addedDaysList: {
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  addedDaysTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: 12,
  },
  addedDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  addedDayName: {
    fontSize: 16,
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
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalContentDark: {
    backgroundColor: '#1c1c1e',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 16,
  },
  suffixInput: {
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  inputLight: {
    backgroundColor: '#f0f0f0',
    color: '#000',
  },
  inputDark: {
    backgroundColor: '#333',
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalConfirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
