import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function WorkoutScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <Text style={styles.subtitle}>Select a workout to begin</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upper / Lower Split</Text>

        <Pressable style={styles.templateCard}>
          <View style={styles.templateContent}>
            <Text style={styles.templateName}>Upper A</Text>
            <Text style={styles.templateMeta}>6 exercises</Text>
          </View>
          <Text style={styles.templateLastDone}>Last: --</Text>
        </Pressable>

        <Pressable style={styles.templateCard}>
          <View style={styles.templateContent}>
            <Text style={styles.templateName}>Upper B</Text>
            <Text style={styles.templateMeta}>6 exercises</Text>
          </View>
          <Text style={styles.templateLastDone}>Last: --</Text>
        </Pressable>

        <Pressable style={styles.templateCard}>
          <View style={styles.templateContent}>
            <Text style={styles.templateName}>Lower A</Text>
            <Text style={styles.templateMeta}>5 exercises</Text>
          </View>
          <Text style={styles.templateLastDone}>Last: --</Text>
        </Pressable>

        <Pressable style={styles.templateCard}>
          <View style={styles.templateContent}>
            <Text style={styles.templateName}>Lower B</Text>
            <Text style={styles.templateMeta}>5 exercises</Text>
          </View>
          <Text style={styles.templateLastDone}>Last: --</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
