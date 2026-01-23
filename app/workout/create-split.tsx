import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { useAllExercises, useWorkoutMutations } from '@/hooks/useWorkoutTemplates';
import { useColorScheme } from '@/components/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

const TEMPLATE_TYPES = ['upper', 'lower', 'push', 'pull', 'legs', 'custom'] as const;
type TemplateType = typeof TEMPLATE_TYPES[number];

const TYPE_LABELS: Record<TemplateType, string> = {
  upper: 'Upper',
  lower: 'Lower',
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  custom: 'Custom',
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
};

type TemplateExercise = {
  id: string;
  exerciseId: string;
  name: string;
  equipment: string;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
};

type Template = {
  id: string;
  name: string;
  type: TemplateType;
  exercises: TemplateExercise[];
};

export default function CreateSplitScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';
  const inputStyle = colorScheme === 'dark' ? styles.inputDark : styles.inputLight;

  const { exercises: allExercises, loading: exercisesLoading } = useAllExercises();
  const { createWorkoutSplit, createWorkoutTemplate, addTemplateExercise } = useWorkoutMutations();

  const [splitName, setSplitName] = useState('');
  const [splitDescription, setSplitDescription] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState<string | null>(null);

  // Add a new template
  const addTemplate = () => {
    const newTemplate: Template = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      type: 'custom',
      exercises: [],
    };
    setTemplates([...templates, newTemplate]);
  };

  // Remove a template
  const removeTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  // Update template name
  const updateTemplateName = (templateId: string, name: string) => {
    setTemplates(templates.map(t =>
      t.id === templateId ? { ...t, name } : t
    ));
  };

  // Update template type
  const updateTemplateType = (templateId: string, type: TemplateType) => {
    setTemplates(templates.map(t =>
      t.id === templateId ? { ...t, type } : t
    ));
    setShowTypePicker(null);
  };

  // Open exercise picker for a template
  const openExercisePicker = (templateId: string) => {
    setActiveTemplateId(templateId);
    setShowExercisePicker(true);
  };

  // Add exercise to template
  const addExerciseToTemplate = (exercise: { id: string; name: string; equipment: string }) => {
    if (!activeTemplateId) return;

    const newExercise: TemplateExercise = {
      id: `exercise-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: exercise.id,
      name: exercise.name,
      equipment: exercise.equipment,
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12,
    };

    setTemplates(templates.map(t =>
      t.id === activeTemplateId
        ? { ...t, exercises: [...t.exercises, newExercise] }
        : t
    ));

    setShowExercisePicker(false);
    setSearchQuery('');
  };

  // Remove exercise from template
  const removeExerciseFromTemplate = (templateId: string, exerciseId: string) => {
    setTemplates(templates.map(t =>
      t.id === templateId
        ? { ...t, exercises: t.exercises.filter(e => e.id !== exerciseId) }
        : t
    ));
  };

  // Update exercise sets/reps
  const updateExercise = (
    templateId: string,
    exerciseId: string,
    field: 'targetSets' | 'targetRepMin' | 'targetRepMax',
    value: number
  ) => {
    setTemplates(templates.map(t =>
      t.id === templateId
        ? {
            ...t,
            exercises: t.exercises.map(e =>
              e.id === exerciseId ? { ...e, [field]: value } : e
            ),
          }
        : t
    ));
  };

  // Move template up
  const moveTemplateUp = (index: number) => {
    if (index === 0) return;
    const newTemplates = [...templates];
    [newTemplates[index - 1], newTemplates[index]] = [newTemplates[index], newTemplates[index - 1]];
    setTemplates(newTemplates);
  };

  // Move template down
  const moveTemplateDown = (index: number) => {
    if (index === templates.length - 1) return;
    const newTemplates = [...templates];
    [newTemplates[index], newTemplates[index + 1]] = [newTemplates[index + 1], newTemplates[index]];
    setTemplates(newTemplates);
  };

  // Save split
  const handleSave = async () => {
    if (!splitName.trim()) {
      Alert.alert('Error', 'Please enter a split name');
      return;
    }

    if (templates.length === 0) {
      Alert.alert('Error', 'Please add at least one template');
      return;
    }

    for (const template of templates) {
      if (!template.name.trim()) {
        Alert.alert('Error', 'Please enter a name for all templates');
        return;
      }
    }

    setSaving(true);

    try {
      // Create the split
      const splitId = await createWorkoutSplit(
        splitName.trim(),
        splitDescription.trim() || undefined
      );

      // Create templates and their exercises
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        const templateId = await createWorkoutTemplate(
          splitId,
          template.name.trim(),
          template.type,
          i
        );

        // Add exercises to template
        for (let j = 0; j < template.exercises.length; j++) {
          const exercise = template.exercises[j];
          await addTemplateExercise(
            templateId,
            exercise.exerciseId,
            j,
            exercise.targetSets,
            exercise.targetRepMin,
            exercise.targetRepMax
          );
        }
      }

      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save split. Please try again.');
      console.error('Error saving split:', error);
    } finally {
      setSaving(false);
    }
  };

  // Filter exercises for picker
  const filteredExercises = allExercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group exercises by muscle
  const groupedExercises = filteredExercises.reduce((acc, ex) => {
    const muscle = ex.primaryMuscle;
    if (!acc[muscle]) acc[muscle] = [];
    acc[muscle].push(ex);
    return acc;
  }, {} as Record<string, typeof filteredExercises>);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Create Split</Text>
        <Pressable
          onPress={handleSave}
          style={styles.headerButton}
          disabled={saving}
        >
          <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          {/* Split Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Split Details</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={[styles.input, inputStyle]}
                value={splitName}
                onChangeText={setSplitName}
                placeholder="e.g., Push/Pull/Legs"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, inputStyle]}
                value={splitDescription}
                onChangeText={setSplitDescription}
                placeholder="e.g., 3-day split"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Templates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Templates</Text>

            {templates.map((template, index) => (
              <View key={template.id} style={styles.templateCard}>
                {/* Template Header */}
                <View style={styles.templateHeader}>
                  <TextInput
                    style={[styles.templateNameInput, inputStyle]}
                    value={template.name}
                    onChangeText={(text) => updateTemplateName(template.id, text)}
                    placeholder="Template Name"
                    placeholderTextColor="#999"
                  />
                  <Pressable
                    onPress={() => removeTemplate(template.id)}
                    style={styles.removeTemplateButton}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff4444" />
                  </Pressable>
                </View>

                {/* Template Type */}
                <View style={styles.typeRow}>
                  <Text style={styles.typeLabel}>Type:</Text>
                  <Pressable
                    style={styles.typeSelector}
                    onPress={() => setShowTypePicker(showTypePicker === template.id ? null : template.id)}
                  >
                    <Text style={styles.typeSelectorText}>
                      {TYPE_LABELS[template.type]}
                    </Text>
                    <Ionicons
                      name={showTypePicker === template.id ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={iconColor}
                    />
                  </Pressable>
                </View>

                {/* Type Picker Dropdown */}
                {showTypePicker === template.id && (
                  <View style={styles.typeDropdown}>
                    {TEMPLATE_TYPES.map(type => (
                      <Pressable
                        key={type}
                        style={[
                          styles.typeOption,
                          template.type === type && styles.typeOptionSelected,
                        ]}
                        onPress={() => updateTemplateType(template.id, type)}
                      >
                        <Text
                          style={[
                            styles.typeOptionText,
                            template.type === type && styles.typeOptionTextSelected,
                          ]}
                        >
                          {TYPE_LABELS[type]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Exercises */}
                <View style={styles.exercisesSection}>
                  <Text style={styles.exercisesLabel}>Exercises:</Text>
                  {template.exercises.map(exercise => (
                    <View key={exercise.id} style={styles.exerciseRow}>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <View style={styles.setsRepsRow}>
                          <TextInput
                            style={[styles.smallInput, inputStyle]}
                            value={exercise.targetSets.toString()}
                            onChangeText={(text) => {
                              const num = parseInt(text, 10);
                              if (!isNaN(num) && num > 0) {
                                updateExercise(template.id, exercise.id, 'targetSets', num);
                              }
                            }}
                            keyboardType="number-pad"
                            placeholder="Sets"
                            placeholderTextColor="#999"
                          />
                          <Text style={styles.setsRepsLabel}>x</Text>
                          <TextInput
                            style={[styles.smallInput, inputStyle]}
                            value={exercise.targetRepMin.toString()}
                            onChangeText={(text) => {
                              const num = parseInt(text, 10);
                              if (!isNaN(num) && num > 0) {
                                updateExercise(template.id, exercise.id, 'targetRepMin', num);
                              }
                            }}
                            keyboardType="number-pad"
                            placeholder="Min"
                            placeholderTextColor="#999"
                          />
                          <Text style={styles.setsRepsLabel}>-</Text>
                          <TextInput
                            style={[styles.smallInput, inputStyle]}
                            value={exercise.targetRepMax.toString()}
                            onChangeText={(text) => {
                              const num = parseInt(text, 10);
                              if (!isNaN(num) && num > 0) {
                                updateExercise(template.id, exercise.id, 'targetRepMax', num);
                              }
                            }}
                            keyboardType="number-pad"
                            placeholder="Max"
                            placeholderTextColor="#999"
                          />
                        </View>
                      </View>
                      <Pressable
                        onPress={() => removeExerciseFromTemplate(template.id, exercise.id)}
                        style={styles.removeExerciseButton}
                      >
                        <Ionicons name="remove-circle" size={20} color="#ff4444" />
                      </Pressable>
                    </View>
                  ))}

                  <Pressable
                    style={styles.addExerciseButton}
                    onPress={() => openExercisePicker(template.id)}
                  >
                    <Ionicons name="add" size={20} color="#007AFF" />
                    <Text style={styles.addExerciseText}>Add Exercise</Text>
                  </Pressable>
                </View>

                {/* Reorder Buttons */}
                <View style={styles.reorderRow}>
                  <Pressable
                    style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                    onPress={() => moveTemplateUp(index)}
                    disabled={index === 0}
                  >
                    <Ionicons
                      name="arrow-up"
                      size={16}
                      color={index === 0 ? '#999' : iconColor}
                    />
                    <Text style={[styles.reorderText, index === 0 && styles.reorderTextDisabled]}>
                      Move Up
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.reorderButton,
                      index === templates.length - 1 && styles.reorderButtonDisabled,
                    ]}
                    onPress={() => moveTemplateDown(index)}
                    disabled={index === templates.length - 1}
                  >
                    <Ionicons
                      name="arrow-down"
                      size={16}
                      color={index === templates.length - 1 ? '#999' : iconColor}
                    />
                    <Text
                      style={[
                        styles.reorderText,
                        index === templates.length - 1 && styles.reorderTextDisabled,
                      ]}
                    >
                      Move Down
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <Pressable style={styles.addTemplateButton} onPress={addTemplate}>
              <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
              <Text style={styles.addTemplateText}>Add Another Template</Text>
            </Pressable>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Exercise Picker Modal */}
      <Modal visible={showExercisePicker} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <Pressable onPress={() => { setShowExercisePicker(false); setSearchQuery(''); }}>
                <Ionicons name="close" size={28} color={iconColor} />
              </Pressable>
            </View>

            <TextInput
              style={[styles.searchInput, inputStyle]}
              placeholder="Search exercises..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <ScrollView style={styles.exerciseList} keyboardShouldPersistTaps="handled">
              {exercisesLoading ? (
                <Text style={styles.loadingText}>Loading exercises...</Text>
              ) : (
                Object.entries(groupedExercises).map(([muscle, exercises]) => (
                  <View key={muscle} style={styles.muscleGroup}>
                    <Text style={styles.muscleTitle}>{MUSCLE_LABELS[muscle] || muscle}</Text>
                    {exercises.map(ex => (
                      <Pressable
                        key={ex.id}
                        style={styles.exerciseItem}
                        onPress={() => addExerciseToTemplate(ex)}
                      >
                        <Text style={styles.exerciseItemName}>{ex.name}</Text>
                        <Text style={styles.exerciseItemEquipment}>
                          {EQUIPMENT_LABELS[ex.equipment] || ex.equipment}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelText: {
    color: '#ff4444',
    fontSize: 16,
  },
  saveText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  inputLight: {
    backgroundColor: '#f0f0f0',
    color: '#000',
  },
  inputDark: {
    backgroundColor: '#333',
    color: '#fff',
  },
  templateCard: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  templateNameInput: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  removeTemplateButton: {
    padding: 8,
    marginLeft: 8,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  typeLabel: {
    fontSize: 14,
    marginRight: 8,
    opacity: 0.7,
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  typeSelectorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  typeDropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
  },
  typeOptionSelected: {
    backgroundColor: '#007AFF',
  },
  typeOptionText: {
    fontSize: 14,
  },
  typeOptionTextSelected: {
    color: '#fff',
  },
  exercisesSection: {
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  exercisesLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.7,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  exerciseInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  setsRepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  smallInput: {
    width: 40,
    padding: 6,
    borderRadius: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  setsRepsLabel: {
    fontSize: 14,
    opacity: 0.5,
  },
  removeExerciseButton: {
    padding: 4,
    marginLeft: 8,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    gap: 6,
  },
  addExerciseText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  reorderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  reorderButtonDisabled: {
    opacity: 0.5,
  },
  reorderText: {
    fontSize: 12,
  },
  reorderTextDisabled: {
    color: '#999',
  },
  addTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  addTemplateText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
  },
  exerciseList: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    opacity: 0.5,
  },
  muscleGroup: {
    marginBottom: 16,
  },
  muscleTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  exerciseItemName: {
    fontSize: 16,
  },
  exerciseItemEquipment: {
    fontSize: 14,
    opacity: 0.5,
  },
});
