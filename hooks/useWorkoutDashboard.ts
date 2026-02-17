import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';
import { workoutSessions, workoutTemplates } from '@/db/schema';
import { desc, gte, isNotNull, and } from 'drizzle-orm';
import { TemplateWithDetails } from './useWorkoutTemplates';
import { getStartOfWeek, getStartOfDay, getDaysSinceDate } from '@/utils/dates';
import { fetchTemplateDetails } from '@/db/queries';

export { getStartOfWeek, getStartOfDay } from '@/utils/dates';

export interface DashboardData {
  thisWeek: {
    workoutCount: number;
    streak: number;
    workoutDays: number[]; // Days of the week with workouts (0=Mon, 6=Sun)
  };
  suggestedWorkout: {
    template: TemplateWithDetails;
    reason: string;
  } | null;
  hasHistory: boolean;
  workedOutToday: boolean;
}

function formatReason(template: TemplateWithDetails, currentDayOfWeek: number): string {
  // Check if the template is scheduled for today
  if (template.dayOfWeek !== null && template.dayOfWeek === currentDayOfWeek) {
    return 'Scheduled for today';
  }

  // Otherwise, show how long since last performed
  if (!template.lastPerformed) {
    return 'Never performed';
  }

  const days = getDaysSinceDate(template.lastPerformed);
  if (days === 0) return 'Done today';
  if (days === 1) return 'Last done yesterday';
  return `Last done ${days} days ago`;
}

export function useWorkoutDashboard() {
  const [data, setData] = useState<DashboardData>({
    thisWeek: { workoutCount: 0, streak: 0, workoutDays: [] },
    suggestedWorkout: null,
    hasHistory: false,
    workedOutToday: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const now = new Date();
      const startOfWeek = getStartOfWeek(now);
      const startOfToday = getStartOfDay(now);
      // Monday = 0, Sunday = 6
      const currentDayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;

      // 1. Get completed sessions from this week
      const weekSessions = await db
        .select()
        .from(workoutSessions)
        .where(
          and(
            isNotNull(workoutSessions.completedAt),
            gte(workoutSessions.completedAt, startOfWeek)
          )
        );

      const workoutCount = weekSessions.length;

      // Calculate which days of the week had workouts (0=Mon, 6=Sun)
      const workoutDaysSet = new Set<number>();
      for (const session of weekSessions) {
        if (session.completedAt) {
          const dayOfWeek = session.completedAt.getDay();
          // Convert to Monday=0 format
          const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          workoutDaysSet.add(adjustedDay);
        }
      }
      const workoutDays = Array.from(workoutDaysSet).sort((a, b) => a - b);

      // Check if worked out today
      const todaySessions = weekSessions.filter(
        s => s.completedAt && s.completedAt >= startOfToday
      );
      const workedOutToday = todaySessions.length > 0;

      // 2. Calculate streak (consecutive days with workouts)
      const allCompletedSessions = await db
        .select()
        .from(workoutSessions)
        .where(isNotNull(workoutSessions.completedAt))
        .orderBy(desc(workoutSessions.completedAt));

      const hasHistory = allCompletedSessions.length > 0;

      let streak = 0;
      if (hasHistory) {
        // Get unique dates (days) with workouts
        const workoutDates = new Set<string>();
        for (const session of allCompletedSessions) {
          if (session.completedAt) {
            const dateStr = getStartOfDay(session.completedAt).toISOString();
            workoutDates.add(dateStr);
          }
        }

        // Count consecutive days backwards from today (or yesterday if no workout today)
        let checkDate = getStartOfDay(now);

        // If no workout today, start checking from yesterday
        if (!workedOutToday) {
          checkDate.setDate(checkDate.getDate() - 1);
        }

        while (workoutDates.has(checkDate.toISOString())) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      // 3. Get suggested workout
      const allTemplates = await db.select().from(workoutTemplates);

      let suggestedWorkout: DashboardData['suggestedWorkout'] = null;

      if (allTemplates.length > 0) {
        const templateIds = allTemplates.map(t => t.id);

        // Use shared query for exercise counts and last performed dates
        const { exerciseCounts, lastPerformed } = fetchTemplateDetails(templateIds);

        // Build templates with details using the batch results
        const templatesWithDetails: TemplateWithDetails[] = allTemplates.map(template => ({
          id: template.id,
          name: template.name,
          type: template.type,
          orderIndex: template.orderIndex,
          dayOfWeek: template.dayOfWeek,
          exerciseCount: exerciseCounts.get(template.id) ?? 0,
          lastPerformed: lastPerformed.get(template.id) ?? null,
        }));

        // Find the best suggestion
        // Priority 1: Template scheduled for today (by dayOfWeek)
        const todayTemplate = templatesWithDetails.find(
          t => t.dayOfWeek !== null && t.dayOfWeek === currentDayOfWeek
        );

        if (todayTemplate) {
          suggestedWorkout = {
            template: todayTemplate,
            reason: formatReason(todayTemplate, currentDayOfWeek),
          };
        } else {
          // Priority 2: Least recently performed template
          const sortedByLastPerformed = [...templatesWithDetails].sort((a, b) => {
            const daysA = getDaysSinceDate(a.lastPerformed);
            const daysB = getDaysSinceDate(b.lastPerformed);
            return daysB - daysA; // Most days since = first
          });

          const leastRecent = sortedByLastPerformed[0];
          if (leastRecent) {
            suggestedWorkout = {
              template: leastRecent,
              reason: formatReason(leastRecent, currentDayOfWeek),
            };
          }
        }
      }

      setData({
        thisWeek: { workoutCount, streak, workoutDays },
        suggestedWorkout,
        hasHistory,
        workedOutToday,
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { data, loading, error, refetch: fetchDashboardData };
}
