import { useState } from 'react';
import { StyleSheet, ScrollView, Pressable, TextInput, Image, Alert } from 'react-native';
import { Text, View, useColors } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Card, Button, SegmentedControl } from '@/components/ui';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';

type FeedbackType = 'bug' | 'feature' | 'other';

const API_URL = 'https://workout-tracker-api-lime.vercel.app/api/feedback';

export default function FeedbackScreen() {
  const router = useRouter();
  const colors = useColors();

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackOptions: { label: string; value: FeedbackType }[] = [
    { value: 'bug', label: 'Bug' },
    { value: 'feature', label: 'Feature' },
    { value: 'other', label: 'Other' },
  ];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setScreenshot(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const isValid = subject.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          subject: subject.trim(),
          description: description.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted. We appreciate you helping improve the app.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Submission Failed',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.groupedBackground }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.groupedBackground }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Submit Feedback</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Feedback Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            FEEDBACK TYPE
          </Text>
          <Card variant="filled" style={styles.card}>
            <SegmentedControl
              options={feedbackOptions}
              selectedValue={feedbackType}
              onValueChange={setFeedbackType}
            />
          </Card>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            DETAILS
          </Text>
          <Card variant="filled" style={styles.card}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Subject</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.inputBackground,
                color: colors.text
              }]}
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief summary of your feedback"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.settingLabel, { color: colors.text, marginTop: Spacing.lg }]}>
              Description
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, {
                backgroundColor: colors.inputBackground,
                color: colors.text
              }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Please describe in detail..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </Card>
        </View>

        {/* Screenshot */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            SCREENSHOT (OPTIONAL)
          </Text>
          {screenshot ? (
            <Card variant="filled" style={styles.card}>
              <View style={styles.screenshotContainer}>
                <Image source={{ uri: screenshot }} style={styles.screenshotPreview} />
                <Pressable
                  onPress={removeScreenshot}
                  style={[styles.removeButton, { backgroundColor: colors.error }]}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </Pressable>
              </View>
            </Card>
          ) : (
            <Pressable onPress={pickImage}>
              <Card variant="filled" style={styles.card}>
                <View style={styles.addScreenshotContent}>
                  <Ionicons name="camera-outline" size={24} color={colors.primary} />
                  <Text style={[styles.addScreenshotText, { color: colors.primary }]}>
                    Add Screenshot
                  </Text>
                </View>
              </Card>
            </Pressable>
          )}
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            CONTACT (OPTIONAL)
          </Text>
          <Card variant="filled" style={styles.card}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.inputBackground,
                color: colors.text
              }]}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={[styles.helperText, { color: colors.textTertiary }]}>
              Only if you'd like us to follow up with you
            </Text>
          </Card>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            title="Submit Feedback"
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={!isValid}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
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
  input: {
    ...Typography.body,
    padding: Spacing.md,
    borderRadius: Radius.medium,
  },
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.md,
  },
  helperText: {
    ...Typography.caption1,
    marginTop: Spacing.sm,
  },
  screenshotContainer: {
    position: 'relative',
  },
  screenshotPreview: {
    width: '100%',
    height: 200,
    borderRadius: Radius.medium,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addScreenshotContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  addScreenshotText: {
    ...Typography.body,
    fontWeight: '600',
  },
  submitSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
});
