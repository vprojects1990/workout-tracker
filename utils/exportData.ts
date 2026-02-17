import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Constants from 'expo-constants';
import { db } from '@/db';
import {
  workoutSplits,
  workoutTemplates,
  templateExercises,
  exercises,
  workoutSessions,
  setLogs,
  mealTargets,
  mealLogs,
  userSettings,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

const EXPORT_VERSION = 1;

export async function exportData(): Promise<void> {
  const data = {
    workoutSplits: db.select().from(workoutSplits).all(),
    workoutTemplates: db.select().from(workoutTemplates).all(),
    templateExercises: db.select().from(templateExercises).all(),
    customExercises: db.select().from(exercises).where(eq(exercises.isCustom, true)).all(),
    workoutSessions: db.select().from(workoutSessions).all(),
    setLogs: db.select().from(setLogs).all(),
    mealTargets: db.select().from(mealTargets).all(),
    mealLogs: db.select().from(mealLogs).all(),
    userSettings: db.select({
      weightUnit: userSettings.weightUnit,
      defaultRestSeconds: userSettings.defaultRestSeconds,
      theme: userSettings.theme,
    }).from(userSettings).all(),
  };

  const exportPayload = {
    exportVersion: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version ?? 'unknown',
    data,
  };

  const json = JSON.stringify(exportPayload, null, 2);
  const date = new Date().toISOString().substring(0, 10);
  const filename = `gymtrack-export-${date}.json`;

  const file = new File(Paths.cache, filename);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(json);

  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Gym Track Data',
      UTI: 'public.json',
    });
  } finally {
    if (file.exists) {
      file.delete();
    }
  }
}
