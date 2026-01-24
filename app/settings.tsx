import { StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Text, View, useColors } from '@/components/Themed';
import { useSettings, WeightUnit } from '@/hooks/useSettings';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, SegmentedControl } from '@/components/ui';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius, Layout } from '@/constants/Spacing';

type Theme = 'light' | 'dark' | 'system';

const REST_OPTIONS = [
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '120s', value: 120 },
  { label: '180s', value: 180 },
];

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const {
    settings,
    loading,
    error,
    updateWeightUnit,
    updateDefaultRestSeconds,
  } = useSettings();
  const { theme, setTheme } = useTheme();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Error: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.groupedBackground }]}>
      <View style={[styles.header, { backgroundColor: colors.groupedBackground }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Units Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            UNITS
          </Text>
          <Card variant="filled" style={styles.card}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Weight Unit
            </Text>
            <SegmentedControl<WeightUnit>
              options={[
                { label: 'kg', value: 'kg' },
                { label: 'lbs', value: 'lbs' },
              ]}
              selectedValue={settings.weightUnit as WeightUnit}
              onValueChange={updateWeightUnit}
              style={styles.segmentedControl}
            />
          </Card>
        </View>

        {/* Rest Timer Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            REST TIMER
          </Text>
          <Card variant="filled" style={styles.card}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Default Rest Time
            </Text>
            <SegmentedControl
              options={REST_OPTIONS.map(opt => ({
                label: opt.label,
                value: String(opt.value)
              }))}
              selectedValue={String(settings.defaultRestSeconds)}
              onValueChange={(value) => updateDefaultRestSeconds(Number(value))}
              style={styles.segmentedControl}
            />
          </Card>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            APPEARANCE
          </Text>
          <Card variant="filled" style={styles.card}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Theme
            </Text>
            <SegmentedControl
              options={[
                { label: 'System', value: 'system' as Theme },
                { label: 'Light', value: 'light' as Theme },
                { label: 'Dark', value: 'dark' as Theme },
              ]}
              selectedValue={theme}
              onValueChange={setTheme}
              style={styles.segmentedControl}
            />
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            SUPPORT
          </Text>
          <Pressable onPress={() => router.push('/feedback')}>
            <Card variant="filled" style={styles.card}>
              <View style={styles.feedbackRow}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                <Text style={[styles.feedbackText, { color: colors.text }]}>
                  Send Feedback
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>
            </Card>
          </Pressable>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.headline,
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.footnote,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.lg,
  },
  card: {
    borderRadius: Radius.large,
  },
  settingLabel: {
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  segmentedControl: {
    marginTop: Spacing.xs,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  feedbackText: {
    ...Typography.body,
    flex: 1,
  },
});
