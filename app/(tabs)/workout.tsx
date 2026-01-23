import { StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useWorkoutTemplates, TemplateWithDetails } from '@/hooks/useWorkoutTemplates';
import { useRouter } from 'expo-router';

function formatLastPerformed(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function TemplateCard({ template }: { template: TemplateWithDetails }) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/workout/${template.id}`);
  };

  return (
    <Pressable style={styles.templateCard} onPress={handlePress}>
      <View style={styles.templateContent}>
        <Text style={styles.templateName}>{template.name}</Text>
        <Text style={styles.templateMeta}>{template.exerciseCount} exercises</Text>
      </View>
      <Text style={styles.templateLastDone}>Last: {formatLastPerformed(template.lastPerformed)}</Text>
    </Pressable>
  );
}

export default function WorkoutScreen() {
  const { templates, loading, error } = useWorkoutTemplates();

  const upperTemplates = templates.filter(t => t.type === 'upper');
  const lowerTemplates = templates.filter(t => t.type === 'lower');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <Text style={styles.subtitle}>Select a workout to begin</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upper</Text>
        {upperTemplates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lower</Text>
        {lowerTemplates.map(template => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </View>
    </ScrollView>
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
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  templateCard: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateContent: {
    backgroundColor: 'transparent',
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
  },
  templateMeta: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  templateLastDone: {
    fontSize: 12,
    opacity: 0.5,
  },
});
