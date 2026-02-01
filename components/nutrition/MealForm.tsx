import React, { useState } from 'react';
import { View, Text, TextInput, Image, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius, Layout } from '@/constants/Spacing';
import { haptics } from '@/utils/haptics';
import { pickMealPhoto, saveMealPhoto, getMealPhotoUri, deleteMealPhoto } from '@/utils/mealImage';

export type MealFormData = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoFilename?: string | null;
};

interface MealFormProps {
  onSubmit: (data: MealFormData) => void;
  onCancel: () => void;
  initialValues?: Partial<MealFormData>;
  loading?: boolean;
}

export function MealForm({ onSubmit, onCancel, initialValues, loading }: MealFormProps) {
  const colors = useColors();
  const [name, setName] = useState(initialValues?.name ?? '');
  const [calories, setCalories] = useState(initialValues?.calories?.toString() ?? '');
  const [protein, setProtein] = useState(initialValues?.protein?.toString() ?? '');
  const [carbs, setCarbs] = useState(initialValues?.carbs?.toString() ?? '');
  const [fat, setFat] = useState(initialValues?.fat?.toString() ?? '');
  const [photoFilename, setPhotoFilename] = useState<string | null>(initialValues?.photoFilename ?? null);
  const [newlySavedPhotos, setNewlySavedPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Meal name is required');
      haptics.tap();
      return;
    }
    const clamp = (v: string, max: number) => Math.min(max, Math.max(0, Number(v) || 0));
    const cal = clamp(calories, 25000);
    if (cal === 0) {
      setError('Calories are required');
      haptics.tap();
      return;
    }
    const prot = clamp(protein, 2000);
    const carb = clamp(carbs, 2000);
    const f = clamp(fat, 1000);

    haptics.success();
    onSubmit({
      name: trimmedName,
      calories: cal,
      protein: prot,
      carbs: carb,
      fat: f,
      photoFilename,
    });
  };

  const handlePickPhoto = async () => {
    const uri = await pickMealPhoto();
    if (uri) {
      const filename = await saveMealPhoto(uri);
      setPhotoFilename(filename);
      setNewlySavedPhotos(prev => [...prev, filename]);
    }
  };

  const handleCancel = async () => {
    // Clean up any newly saved photos that won't be submitted
    const keepPhoto = photoFilename;
    for (const photo of newlySavedPhotos) {
      if (photo !== keepPhoto) {
        await deleteMealPhoto(photo).catch(() => {});
      }
    }
    // Also delete the current photo if it's new (not the original)
    if (keepPhoto && newlySavedPhotos.includes(keepPhoto) && keepPhoto !== initialValues?.photoFilename) {
      await deleteMealPhoto(keepPhoto).catch(() => {});
    }
    onCancel();
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.separator },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>
          {initialValues ? 'Edit Meal' : 'Add Meal'}
        </Text>

        {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

        <TextInput
          style={inputStyle}
          placeholder="Meal name"
          placeholderTextColor={colors.inputPlaceholder}
          value={name}
          onChangeText={(t) => { setName(t); setError(null); }}
          maxLength={100}
          autoFocus
        />

        <View style={styles.macroRow}>
          <TextInput
            style={[inputStyle, styles.macroInput]}
            placeholder="Calories"
            placeholderTextColor={colors.inputPlaceholder}
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
          />
          <TextInput
            style={[inputStyle, styles.macroInput]}
            placeholder="Protein (g)"
            placeholderTextColor={colors.inputPlaceholder}
            value={protein}
            onChangeText={setProtein}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.macroRow}>
          <TextInput
            style={[inputStyle, styles.macroInput]}
            placeholder="Carbs (g)"
            placeholderTextColor={colors.inputPlaceholder}
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="numeric"
          />
          <TextInput
            style={[inputStyle, styles.macroInput]}
            placeholder="Fat (g)"
            placeholderTextColor={colors.inputPlaceholder}
            value={fat}
            onChangeText={setFat}
            keyboardType="numeric"
          />
        </View>

        {/* Photo section */}
        {photoFilename ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri: getMealPhotoUri(photoFilename) }} style={styles.previewImage} />
            <Pressable onPress={() => setPhotoFilename(null)} style={styles.removePhoto} accessibilityLabel="Remove photo" accessibilityRole="button">
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={handlePickPhoto} style={[styles.photoButton, { borderColor: colors.separator }]}>
            <Ionicons name="camera-outline" size={20} color={colors.systemGray} />
            <Text style={[styles.photoButtonText, { color: colors.systemGray }]}>Add Photo</Text>
          </Pressable>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleCancel}
            style={[styles.button, { backgroundColor: colors.buttonSecondary }]}
          >
            <Text style={[styles.buttonText, { color: colors.buttonSecondaryText }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.button, styles.primaryButton, { backgroundColor: colors.buttonPrimary }]}
          >
            <Text style={[styles.buttonText, { color: colors.buttonPrimaryText }]}>Save Meal</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  title: {
    ...Typography.title2,
    marginBottom: Spacing.lg,
  },
  error: {
    ...Typography.footnote,
    marginBottom: Spacing.sm,
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
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  macroInput: {
    flex: 1,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.medium,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  photoButtonText: {
    ...Typography.subhead,
  },
  photoPreview: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: Radius.medium,
  },
  removePhoto: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
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
  primaryButton: {},
  buttonText: {
    ...Typography.headline,
  },
});
