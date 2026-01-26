# Frontend Architecture

> Last updated: 2026-01-26

## Entry Point

The app entry point is `app/_layout.tsx`, which sets up:

1. **Font Loading** - DM Sans font family + SpaceMono for numbers
2. **Gesture Handler** - `GestureHandlerRootView` wrapper
3. **Database Provider** - Initializes SQLite and runs migrations
4. **Theme Provider** - Manages light/dark theme based on user preference
5. **Navigation** - Stack navigator with tabs and modal screens

```tsx
// app/_layout.tsx structure
<GestureHandlerRootView>
  <DatabaseProvider>
    <ThemeProvider>
      <NavigationThemeProvider>
        <Stack>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout/[id]" presentation="modal" />
          ...
        </Stack>
      </NavigationThemeProvider>
    </ThemeProvider>
  </DatabaseProvider>
</GestureHandlerRootView>
```

## Screen Structure

### Tab Screens (`app/(tabs)/`)

| Screen | File | Purpose |
|--------|------|---------|
| Workout | `workout.tsx` | Dashboard with splits, templates, suggested workout |
| History | `history.tsx` | List of completed workout sessions |
| Insights | `insights.tsx` | Progress analytics and statistics |

### Modal Screens

| Screen | File | Purpose |
|--------|------|---------|
| Active Workout | `workout/[id].tsx` | Live workout session with set logging |
| Empty Workout | `workout/empty.tsx` | Ad-hoc workout without template |
| Create Split | `workout/create-split.tsx` | Multi-step wizard for creating splits |
| Settings | `settings.tsx` | User preferences |
| Feedback | `feedback.tsx` | Bug report / feature request form |

## Component Library

### UI Components (`components/ui/`)

| Component | Purpose |
|-----------|---------|
| `Button.tsx` | Primary, secondary, and ghost button variants |
| `Card.tsx` | Container with shadow and rounded corners |
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
| `SetInput.tsx` | Weight and reps input for a single set |
| `RestTimer.tsx` | Full-screen and mini rest timer overlay |
| `WorkoutProgress.tsx` | Progress bar showing completed exercises |

### History Components (`components/history/`)

| Component | Purpose |
|-----------|---------|
| `HistoryCard.tsx` | Workout session summary card |
| `VolumeChart.tsx` | Volume over time chart |

### Insights Components (`components/insights/`)

| Component | Purpose |
|-----------|---------|
| `ProgressSparkline.tsx` | Mini line chart for progress trends |
| `SummaryStats.tsx` | Aggregate statistics display |

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
- Bottom tab bar with 3 tabs
- Icons from `@expo/vector-icons/FontAwesome`
- Active tab highlighted with brand color

### Modal Presentation
- Full-screen modals for focused tasks
- Swipe down to dismiss (iOS)
- Custom header with close button

### Deep Linking
- `workout/[id]` accepts template ID as parameter
- Used for suggested workout quick-start
