import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Modal, Pressable, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius, Layout } from '@/constants/Spacing';
import { useFoodSearch } from '@/hooks/useFoodSearch';
import { FoodResultRow } from './FoodResultRow';
import { WeightInputPanel } from './WeightInputPanel';
import type { FoodItem, EstimatedMacros } from '@/utils/foodSearch';

interface FoodSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (macros: EstimatedMacros) => void;
}

export function FoodSearchModal({ visible, onClose, onSelect }: FoodSearchModalProps) {
  const colors = useColors();
  const { query, results, loading, error, search, clear } = useFoodSearch();
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  const handleClose = () => {
    setSelectedFood(null);
    clear();
    onClose();
  };

  const handleSelect = (food: FoodItem) => {
    setSelectedFood(food);
  };

  const handleUse = (macros: EstimatedMacros) => {
    onSelect(macros);
    handleClose();
  };

  const handleBack = () => {
    setSelectedFood(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.separator }]}>
          <Text style={[styles.title, { color: colors.text }]}>Search Food</Text>
          <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close-circle" size={28} color={colors.systemGray} />
          </Pressable>
        </View>

        {selectedFood ? (
          <WeightInputPanel food={selectedFood} onUse={handleUse} onBack={handleBack} />
        ) : (
          <>
            {/* Search Input */}
            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color={colors.systemGray} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.separator }]}
                placeholder="Search foods (e.g. chicken breast)"
                placeholderTextColor={colors.inputPlaceholder}
                value={query}
                onChangeText={search}
                autoFocus
                returnKeyType="search"
                maxLength={100}
              />
            </View>

            {/* Results */}
            {loading && (
              <View style={styles.center}>
                <ActivityIndicator color={colors.accent} />
              </View>
            )}

            {error && (
              <View style={styles.center}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            {!loading && !error && results.length === 0 && query.trim().length >= 2 && (
              <View style={styles.center}>
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No results found</Text>
              </View>
            )}

            <FlatList
              data={results}
              keyExtractor={(item) => String(item.fdcId)}
              renderItem={({ item }) => <FoodResultRow food={item} onSelect={handleSelect} />}
              keyboardShouldPersistTaps="handled"
            />
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    ...Typography.title3,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchIcon: {
    position: 'absolute',
    left: Spacing.lg + Spacing.md,
    zIndex: 1,
  },
  searchInput: {
    ...Typography.body,
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingLeft: Spacing.xl + Spacing.md,
    paddingRight: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: Layout.inputHeight,
  },
  center: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    ...Typography.subhead,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.subhead,
    textAlign: 'center',
  },
});
