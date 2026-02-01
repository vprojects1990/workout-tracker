import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, Pressable, Modal, View as RNView } from 'react-native';
import { Text, View, useColors } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { useMealTracking } from '@/hooks/useMealTracking';
import { DaySelector } from '@/components/nutrition/DaySelector';
import { MacroRings } from '@/components/nutrition/MacroRings';
import { MealCard } from '@/components/nutrition/MealCard';
import { MealForm } from '@/components/nutrition/MealForm';
import type { MealFormData } from '@/components/nutrition/MealForm';
import { MacroTargetsForm } from '@/components/nutrition/MacroTargetsForm';
import { NutritionEmptyState } from '@/components/nutrition/NutritionEmptyState';
import { SwipeableRow } from '@/components/ui/SwipeableRow';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { haptics } from '@/utils/haptics';
import { formatDateKey, getWeekdaysOfWeek, canLogMeal } from '@/utils/mealDates';
import type { MealLog } from '@/db/schema';

export default function NutritionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Date state
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    // If weekend, default to last Friday
    const day = today.getDay();
    if (day === 0) today.setDate(today.getDate() - 2); // Sun → Fri
    if (day === 6) today.setDate(today.getDate() - 1); // Sat → Fri
    return today;
  });
  const [weekOffset, setWeekOffset] = useState(0);

  const dateKey = formatDateKey(selectedDate);
  const {
    meals,
    targets,
    totals,
    weekSummary,
    loading,
    addMeal,
    updateMeal,
    deleteMeal,
    updateTargets,
    refetch,
  } = useMealTracking(dateKey, weekOffset);

  // Modal state
  const [mealFormVisible, setMealFormVisible] = useState(false);
  const [targetsFormVisible, setTargetsFormVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null);

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleAddMeal = () => {
    setEditingMeal(null);
    setMealFormVisible(true);
  };

  const handleEditMeal = (meal: MealLog) => {
    setEditingMeal(meal);
    setMealFormVisible(true);
  };

  const handleMealSubmit = async (data: MealFormData) => {
    if (editingMeal) {
      await updateMeal(editingMeal.id, data);
    } else {
      await addMeal(data);
    }
    setMealFormVisible(false);
    setEditingMeal(null);
  };

  const handleDeleteMeal = async (id: string) => {
    haptics.warning();
    await deleteMeal(id);
  };

  const handleTargetsSave = async (newTargets: { calories: number; protein: number; carbs: number; fat: number }) => {
    await updateTargets(newTargets);
    setTargetsFormVisible(false);
  };

  const defaultTargets = targets ?? { calories: 2000, protein: 150, carbs: 250, fat: 65 };
  const canLog = canLogMeal(selectedDate);

  return (
    <View style={[styles.container, { backgroundColor: colors.groupedBackground }]}>
      <RNView style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={styles.title}>Nutrition</Text>
        <Pressable testID="targets-settings" onPress={() => setTargetsFormVisible(true)} accessibilityLabel="Macro target settings" accessibilityRole="button">
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </Pressable>
      </RNView>

      <DaySelector
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        weekOffset={weekOffset}
        onWeekChange={setWeekOffset}
        weekSummary={weekSummary}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MacroRings totals={totals} targets={defaultTargets} />

        {meals.length === 0 ? (
          <NutritionEmptyState />
        ) : (
          <RNView style={styles.mealList}>
            {meals.map((meal) => (
              <SwipeableRow key={meal.id} onDelete={() => handleDeleteMeal(meal.id)}>
                <MealCard meal={meal} onPress={() => handleEditMeal(meal)} />
              </SwipeableRow>
            ))}
          </RNView>
        )}

        {/* Weekly Overview */}
        {weekSummary.length > 0 && (
          <RNView style={[styles.weeklyCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.weeklyTitle, { color: colors.text }]}>Weekly Overview</Text>
            {weekSummary.map((day) => (
              <RNView key={day.date} style={styles.weeklyRow}>
                <Text style={[styles.weeklyDay, { color: colors.textSecondary }]}>
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={[styles.weeklyCals, { color: colors.text }]}>
                  {day.mealCount > 0 ? `${day.totalCalories} kcal` : '—'}
                </Text>
                <RNView style={[
                  styles.statusIndicator,
                  {
                    backgroundColor:
                      day.status === 'on-target' ? colors.systemGreen :
                      day.status === 'close' ? colors.systemOrange :
                      day.status === 'over' || day.status === 'off-target' ? colors.error :
                      colors.fillTertiary,
                  },
                ]} />
              </RNView>
            ))}
          </RNView>
        )}
      </ScrollView>

      {/* FAB */}
      {canLog && (
        <Pressable
          testID="fab-add-meal"
          onPress={handleAddMeal}
          accessibilityLabel="Add meal"
          accessibilityRole="button"
          style={[styles.fab, { backgroundColor: colors.accent, bottom: insets.bottom + Spacing.lg }]}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </Pressable>
      )}

      {/* Meal Form Modal */}
      <Modal visible={mealFormVisible} animationType="slide" presentationStyle="pageSheet">
        <RNView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <MealForm
            onSubmit={handleMealSubmit}
            onCancel={() => { setMealFormVisible(false); setEditingMeal(null); }}
            initialValues={editingMeal ? {
              name: editingMeal.name,
              calories: editingMeal.calories,
              protein: editingMeal.protein,
              carbs: editingMeal.carbs,
              fat: editingMeal.fat,
              photoFilename: editingMeal.photoFilename,
            } : undefined}
          />
        </RNView>
      </Modal>

      {/* Targets Form Modal */}
      <Modal visible={targetsFormVisible} animationType="slide" presentationStyle="pageSheet">
        <RNView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <MacroTargetsForm
            currentTargets={defaultTargets}
            onSave={handleTargetsSave}
            onCancel={() => setTargetsFormVisible(false)}
          />
        </RNView>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    ...Typography.largeTitle,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  mealList: {
    gap: Spacing.sm,
  },
  weeklyCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Radius.large,
  },
  weeklyTitle: {
    ...Typography.headline,
    marginBottom: Spacing.md,
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  weeklyDay: {
    ...Typography.subhead,
    width: 40,
  },
  weeklyCals: {
    ...Typography.subhead,
    flex: 1,
    textAlign: 'right',
    marginRight: Spacing.md,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
});
