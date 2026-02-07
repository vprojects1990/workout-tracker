# Frontend Architecture

> Last updated: 2026-02-07 (rev 6 -- codebase optimization refactoring)

## Entry Point

The app entry point is `app/_layout.tsx`, which sets up:

1. **Font Loading** - DM Sans font family + SpaceMono for numbers
2. **Gesture Handler** - `GestureHandlerRootView` wrapper
3. **Database Provider** - Initializes SQLite and runs migrations
4. **Active Workout Provider** - Persists in-progress workouts across app restarts
5. **Theme Provider** - Manages light/dark theme based on user preference
6. **Navigation** - Stack navigator with tabs and modal screens

```tsx
// app/_layout.tsx structure
<GestureHandlerRootView>
  <DatabaseProvider>
    <DatabaseReadyGate>          {/* Waits for DB init */}
      <ThemeProvider>
        <ActiveWorkoutProvider>
          <ErrorBoundary>
            <NavigationThemeProvider>
              <Stack>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="workout/[id]" presentation="modal" />
                <Stack.Screen name="workout/empty" presentation="modal" />
                <Stack.Screen name="workout/create-split" presentation="modal" />
                <Stack.Screen name="workout/edit-template" presentation="modal" />
                <Stack.Screen name="settings" presentation="modal" />
                <Stack.Screen name="feedback" presentation="modal" />
              </Stack>
            </NavigationThemeProvider>
          </ErrorBoundary>
        </ActiveWorkoutProvider>
      </ThemeProvider>
    </DatabaseReadyGate>
  </DatabaseProvider>
</GestureHandlerRootView>
```

**Note:** The `DatabaseReadyGate` component gates rendering until SQLite is initialized and migrations have run. This prevents hooks from accessing the database before it is ready. A previous `modal` route reference was removed as part of dead code cleanup (the `modal.tsx` file no longer exists).

## Screen Structure

### Tab Screens (`app/(tabs)/`)

| Screen | File | Purpose |
|--------|------|---------|
| Workout | `workout.tsx` | Dashboard with splits, templates, suggested workout |
| History | `history.tsx` | List of completed workout sessions |
| Nutrition | `nutrition.tsx` | Meal logging, macro tracking, weekly adherence |
| Insights | `insights.tsx` | Progress analytics and statistics |

### Modal Screens

| Screen | File | Purpose |
|--------|------|---------|
| Active Workout | `workout/[id].tsx` | Live workout session with set logging |
| Empty Workout | `workout/empty.tsx` | Ad-hoc workout without template |
| Create Split | `workout/create-split.tsx` | Multi-step wizard for creating splits |
| Edit Template | `workout/edit-template.tsx` | Edit exercises in an existing template (add, remove, reorder) |
| Settings | `settings.tsx` | User preferences |
| Feedback | `feedback.tsx` | Bug report / feature request form |

## Component Library

### UI Components (`components/ui/`)

| Component | Purpose |
|-----------|---------|
| `Button.tsx` | Primary, secondary, and ghost button variants (uses `usePressScale` hook) |
| `Card.tsx` | Container with shadow and rounded corners (uses `usePressScale` hook when pressable) |
| `Badge.tsx` | Small label/tag component |
| `Input.tsx` | Text input with label and error states |
| `ListItem.tsx` | Touchable list row with chevron |
| `SegmentedControl.tsx` | Tab-like selection control |
| `SwipeableRow.tsx` | Swipe-to-delete row wrapper |

### Dashboard Components (`components/dashboard/`)

| Component | Purpose |
|-----------|---------|
| `WeekCalendar.tsx` | Horizontal week view with workout day indicators |
| `StreakDisplay.tsx` | Current workout streak with fire icon |
| `StreakMilestone.tsx` | Celebration for streak milestones |
| `SuggestedWorkoutCard.tsx` | Recommended workout based on schedule/recency |
| `QuickStatsCard.tsx` | Weekly workout count summary |

### Workout Components (`components/workout/`)

| Component | Purpose |
|-----------|---------|
| `ExerciseCard.tsx` | Exercise display with sets/reps targets |
| `ExercisePickerModal.tsx` | Shared full-screen modal for searching and selecting exercises by muscle group |
| `SetInput.tsx` | Weight and reps input for a single set |
| `RestTimer.tsx` | Full-screen and mini rest timer overlay |
| `WorkoutProgress.tsx` | Progress bar showing completed exercises |

The `ExercisePickerModal` is a shared component used by `create-split.tsx`, `edit-template.tsx`, `[id].tsx`, and `empty.tsx`. It was extracted to eliminate duplication of the search/filter/group-by-muscle logic that was previously inlined in each screen. It exports `MUSCLE_LABELS` locally and re-exports `EQUIPMENT_LABELS` from `@/constants/Labels`.

### Nutrition Components (`components/nutrition/`)

| Component | Purpose |
|-----------|---------|
| `DaySelector.tsx` | Mon-Fri day picker with adherence status indicators |
| `MacroRings.tsx` | Circular progress rings for calories, protein, carbs, fat |
| `MealCard.tsx` | Single meal entry card with photo, macros, edit/delete |
| `MealForm.tsx` | Add/edit meal form with macro inputs, photo picker, and "Search Food" button |
| `MacroTargetsForm.tsx` | Set daily calorie and macro targets |
| `NutritionEmptyState.tsx` | Empty state shown when no meals logged for a day |
| `FoodSearchModal.tsx` | Full-screen modal for USDA food search with debounced input |
| `FoodResultRow.tsx` | Single food result row showing name and cal/100g badge |
| `WeightInputPanel.tsx` | Weight input (grams) with live macro preview and "Use" action |

### Animation Components (`components/animations/`)

| Component | Purpose |
|-----------|---------|
| `Confetti.tsx` | Celebration confetti animation |
| `AnimatedCheckmark.tsx` | Animated checkmark for completion |
| `PRCelebration.tsx` | Personal record celebration overlay |

### Wizard Components (`components/wizard/`)

| Component | Purpose |
|-----------|---------|
| `DayPicker.tsx` | Day-of-week multi-select picker |
| `StepIndicator.tsx` | Multi-step progress indicator |

## Design System

### Labels (`constants/Labels.ts`)

Centralized display-label lookup maps used across multiple components:

```typescript
EQUIPMENT_LABELS: Record<string, string>
// barbell → 'Barbell', dumbbell → 'Dumbbell', cable → 'Cable',
// machine → 'Machine', bodyweight → 'Bodyweight'
```

Consumed by: `ExerciseCard`, `ExercisePickerModal`, `SuggestedWorkoutCard`, and tab screens.

### Colors (`constants/Colors.ts`)

Uses the **"Focused Intensity"** color palette:

```typescript
// Brand Colors
const BrandColors = {
  primary: { light: '#1A1A2E', dark: '#E94560' },  // Deep Navy / Coral Red
  accent: { light: '#E94560', dark: '#E94560' },   // Coral Red (energy, PRs)
  success: { light: '#06D6A0', dark: '#06D6A0' },  // Mint (completed sets)
  warning: { light: '#FF9500', dark: '#FF9F0A' },  // Orange
  error: { light: '#E94560', dark: '#FF6B6B' },    // Red variants
};

// Light theme
light: {
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#3C3C43',
  border: '#E5E5EA',
  tint: '#E94560',  // Coral accent
}

// Dark theme
dark: {
  background: '#0F0F14',
  card: '#1A1A24',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  border: '#38383A',
  tint: '#E94560',  // Coral accent
}

// Semantic workout colors
prBadge: accent,           // Personal records
streakActive: '#FF9500',   // Streak flame (light) / '#FFD60A' (dark)
completedSet: success,     // Completed sets
restTimer: accent,         // Rest timer highlight
```

### Typography (`constants/Typography.ts`)

| Style | Font | Size | Weight |
|-------|------|------|--------|
| h1 | DM Sans | 32px | Bold |
| h2 | DM Sans | 24px | SemiBold |
| h3 | DM Sans | 20px | SemiBold |
| body | DM Sans | 16px | Regular |
| bodySmall | DM Sans | 14px | Regular |
| caption | DM Sans | 12px | Regular |
| number | SpaceMono | 16px | Regular |

### Spacing (`constants/Spacing.ts`)

```typescript
xs: 4
sm: 8
md: 16
lg: 24
xl: 32
xxl: 48
```

## State Management

The app uses local state with custom hooks for data management:

- **No global state library** - React hooks + Context for simplicity
- **Database as source of truth** - All persistent state in SQLite
- **Hooks for queries** - Custom hooks encapsulate database queries
- **Optimistic updates** - UI updates immediately, syncs to DB

## Navigation Patterns

### Tab Navigation
- Bottom tab bar with 4 tabs (Workout, History, Nutrition, Insights)
- Icons from `@expo/vector-icons/FontAwesome`
- Active tab highlighted with brand color

### Modal Presentation
- Full-screen modals for focused tasks
- Swipe down to dismiss (iOS)
- Custom header with close button

### Deep Linking
- `workout/[id]` accepts template ID as parameter
- Used for suggested workout quick-start
- `workout/edit-template?templateId=xxx` accepts template ID as query parameter
- Used for editing exercises within an existing template from the dashboard

## Shared Types (`types/`)

Centralized TypeScript types extracted from individual modules to eliminate circular dependencies and duplication:

| Type | Purpose | Previously Defined In |
|------|---------|----------------------|
| `SetData` | Base set data (setNumber, reps, weight, completed) | `components/workout/SetInput.tsx` |
| `ActiveSetData` | Extended set with id and dbSynced flag | `contexts/ActiveWorkoutContext.tsx` |
| `ExerciseSettings` | Per-exercise rest/weight overrides | `contexts/ActiveWorkoutContext.tsx` |
| `WorkoutExercise` | Full exercise with sets and settings | `contexts/ActiveWorkoutContext.tsx` |
| `WorkoutHistoryItem` | Completed session summary | `hooks/useWorkoutHistory.ts` |
| `ExerciseDetail` | Exercise detail within a session | `hooks/useWorkoutHistory.ts` |

All types are exported from `types/index.ts` via barrel export. Consuming modules import from `@/types`.

## Date Utilities (`utils/dates.ts`)

Centralized date formatting and comparison helpers, extracted from inline logic in hooks and tab screens:

| Function | Signature | Purpose |
|----------|-----------|---------|
| `formatRelativeDate` | `(date: Date) => string` | "Today", "Yesterday", "Monday", "Jan 15" |
| `formatLastPerformed` | `(date: Date \| null) => string` | "Today", "3 days ago", "2 weeks ago", "Never" |
| `formatDuration` | `(seconds: number) => string` | "45m", "1h 30m" |
| `getStartOfWeek` | `(date: Date) => Date` | Monday 00:00:00 of the given week |
| `getStartOfDay` | `(date: Date) => Date` | Midnight of the given date |
| `getDaysSinceDate` | `(date: Date \| null) => number` | Calendar days between date and now (Infinity if null) |

Consumed by: `useWorkoutDashboard`, `useWorkoutHistory`, `history.tsx`, `insights.tsx`, `workout.tsx`.

## Animation Hooks

### `usePressScale` (`hooks/usePressScale.ts`)

Reusable Reanimated press-scale animation hook extracted from duplicated inline animation logic in `Button` and `Card`.

```typescript
const { animatedStyle, handlePressIn, handlePressOut } = usePressScale({
  pressedScale: 0.95,    // Scale on press-in (default: 0.95)
  bounce: true,          // Bounce on release (default: true)
  overshootScale: 1.02,  // Overshoot on release (default: 1.02)
  pressInConfig: { damping: 15, stiffness: 400, mass: 0.8 },
  bounceConfig: { damping: 8, stiffness: 350, mass: 0.6 },
  settleConfig: { damping: 12, stiffness: 200, mass: 0.8 },
});
```

Uses `useSharedValue`, `useAnimatedStyle`, `withSpring`, and `withSequence` from `react-native-reanimated`.

Consumed by: `Button.tsx` (scale 0.95), `Card.tsx` (scale 0.97, only when pressable).
