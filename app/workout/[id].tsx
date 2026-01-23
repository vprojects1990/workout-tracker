import { useState } from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTemplateExercises, TemplateExerciseWithDetails } from '@/hooks/useWorkoutTemplates';
import { useActiveWorkout, SetData } from '@/hooks/useActiveWorkout';
import { useColorScheme } from '@/components/useColorScheme';

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ':' + secs.toString().padStart(2, '0');
}

type SetRowProps = {
  set: SetData;
  onComplete: (reps: number, weight: number) => void;
  lastWeight: number | null;
  weightUnit: string;
};

function SetRow({ set, onComplete, lastWeight, weightUnit }: SetRowProps) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState(lastWeight?.toString() || '');
  const colorScheme = useColorScheme();
  const inputStyle = colorScheme === 'dark' ? styles.inputDark : styles.inputLight;

  const handleComplete = () => {
    const repsNum = parseInt(reps, 10);
    const weightNum = parseFloat(weight);
    if (!isNaN(repsNum) && !isNaN(weightNum)) {
      onComplete(repsNum, weightNum);
    }
  };

  if (set.completed) {
    return (
      <View style={styles.setRow}>
        <Text style={styles.setNumber}>{set.setNumber}</Text>
        <Text style={styles.setWeight}>{set.weight} {weightUnit}</Text>
        <Text style={styles.setReps}>{set.reps} reps</Text>
        <Text style={styles.checkmark}>✓</Text>
      </View>
    );
  }

  return (
    <View style={styles.setRow}>
      <Text style={styles.setNumber}>{set.setNumber}</Text>
      <TextInput
        style={[styles.input, inputStyle]}
        value={weight}
        onChangeText={setWeight}
        placeholder={weightUnit}
        keyboardType="decimal-pad"
        placeholderTextColor="#999"
      />
      <TextInput
        style={[styles.input, inputStyle]}
        value={reps}
        onChangeText={setReps}
        placeholder="Reps"
        keyboardType="number-pad"
        placeholderTextColor="#999"
      />
      <Pressable style={styles.completeButton} onPress={handleComplete}>
        <Text style={styles.completeButtonText}>✓</Text>
      </Pressable>
    </View>
  );
}

type ExerciseCardProps = {
  exercise: TemplateExerciseWithDetails;
  sets: SetData[];
  lastWeight: number | null;
  onLogSet: (setNumber: number, reps: number, weight: number) => void;
  weightUnit: string;
};

function ExerciseCard({ exercise, sets, lastWeight, onLogSet, weightUnit }: ExerciseCardProps) {
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseEquipment}>{EQUIPMENT_LABELS[exercise.equipment]}</Text>
      </View>
      {lastWeight && (
        <Text style={styles.lastWeight}>Last: {lastWeight} {weightUnit}</Text>
      )}
      <Text style={styles.repRange}>{exercise.targetRepMin}-{exercise.targetRepMax} reps</Text>

      <View style={styles.setsContainer}>
        <View style={styles.setHeaderRow}>
          <Text style={styles.setHeaderText}>Set</Text>
          <Text style={styles.setHeaderText}>{weightUnit}</Text>
          <Text style={styles.setHeaderText}>Reps</Text>
          <Text style={styles.setHeaderText}></Text>
        </View>
        {sets.map(set => (
          <SetRow
            key={set.setNumber}
            set={set}
            onComplete={(reps, weight) => onLogSet(set.setNumber, reps, weight)}
            lastWeight={lastWeight}
            weightUnit={weightUnit}
          />
        ))}
      </View>
    </View>
  );
}

export default function ActiveWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { exercises, loading: exercisesLoading } = useTemplateExercises(id || null);

  const {
    progress,
    elapsedSeconds,
    restSeconds,
    isComplete,
    logSet,
    completeWorkout,
    dismissRestTimer,
  } = useActiveWorkout(id || '', exercises);

  const weightUnit = 'kg'; // TODO: Get from settings

  if (exercisesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isComplete) {
    return (
      <View style={styles.completeContainer}>
        <Text style={styles.completeTitle}>Workout Complete!</Text>
        <Text style={styles.completeTime}>Duration: {formatTime(elapsedSeconds)}</Text>
        <Pressable style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
        <Pressable onPress={completeWorkout}>
          <Text style={styles.finishText}>Finish</Text>
        </Pressable>
      </View>

      {restSeconds !== null && restSeconds > 0 && (
        <Pressable style={styles.restOverlay} onPress={dismissRestTimer}>
          <View style={styles.restCard}>
            <Text style={styles.restTitle}>Rest</Text>
            <Text style={styles.restTime}>{formatTime(restSeconds)}</Text>
            <Text style={styles.restTap}>Tap to dismiss</Text>
          </View>
        </Pressable>
      )}

      <ScrollView style={styles.scrollView}>
        {exercises.map(exercise => {
          const exerciseProgress = progress.get(exercise.exerciseId);
          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              sets={exerciseProgress?.sets || []}
              lastWeight={exerciseProgress?.lastWeight || null}
              onLogSet={(setNumber, reps, weight) =>
                logSet(exercise.exerciseId, setNumber, reps, weight, 90)
              }
              weightUnit={weightUnit}
            />
          );
        })}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  cancelText: {
    color: '#ff4444',
    fontSize: 16,
  },
  timer: {
    fontSize: 20,
    fontWeight: '600',
  },
  finishText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  exerciseCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
  },
  exerciseEquipment: {
    fontSize: 14,
    opacity: 0.7,
  },
  lastWeight: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  repRange: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  setsContainer: {
    marginTop: 12,
  },
  setHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  setHeaderText: {
    flex: 1,
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  setNumber: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  setWeight: {
    flex: 1,
    textAlign: 'center',
  },
  setReps: {
    flex: 1,
    textAlign: 'center',
  },
  checkmark: {
    flex: 1,
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: 18,
  },
  input: {
    flex: 1,
    marginHorizontal: 4,
    padding: 8,
    borderRadius: 8,
    textAlign: 'center',
  },
  inputLight: {
    backgroundColor: '#fff',
    color: '#000',
  },
  inputDark: {
    backgroundColor: '#333',
    color: '#fff',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
    marginLeft: 4,
  },
  completeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  restOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  restCard: {
    backgroundColor: '#333',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  restTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  restTime: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 20,
  },
  restTap: {
    fontSize: 14,
    color: '#999',
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  completeTime: {
    fontSize: 18,
    opacity: 0.7,
    marginTop: 8,
  },
  doneButton: {
    marginTop: 40,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});
