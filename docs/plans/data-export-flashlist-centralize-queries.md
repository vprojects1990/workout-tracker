# Implementation Plan: Data Export, FlashList Migration & Centralized Data Fetching

## Requirements Restatement

Three improvements to the gym-track app:

1. **Data Export** — Allow users to export their full database as JSON from the Settings screen, using `expo-file-system` and `expo-sharing`
2. **FlashList Migration** — Replace `ScrollView`-based lists with `@shopify/flash-list` for virtualized rendering on screens with growing data
3. **Centralize Data Fetching** — Extract duplicated database queries into a shared `db/queries.ts` module and update all hooks to use it

---

## Feature 1: Data Export

### Goal
Add an "Export Data" button to `app/settings.tsx` that serializes all user data to a JSON file and opens the system share sheet.

### Tables to Export
| Table | Filter | Notes |
|---|---|---|
| `workout_splits` | All | |
| `workout_templates` | All | |
| `template_exercises` | All | |
| `exercises` | `isCustom = true` only | Built-in exercises are seeded; only export custom |
| `workout_sessions` | All | |
| `set_logs` | All | |
| `meal_targets` | All | |
| `meal_logs` | All | |
| `user_settings` | All | |

**Excluded:** `food_cache`, `food_search_cache` (ephemeral USDA cache, re-fetchable)

### Export Format
```json
{
  "exportVersion": 1,
  "exportedAt": "2026-02-12T10:30:00.000Z",
  "appVersion": "1.1.0",
  "data": {
    "workoutSplits": [...],
    "workoutTemplates": [...],
    "templateExercises": [...],
    "customExercises": [...],
    "workoutSessions": [...],
    "setLogs": [...],
    "mealTargets": [...],
    "mealLogs": [...],
    "userSettings": [...]
  }
}
```

### New Dependencies
- `expo-file-system` — write JSON to temporary file
- `expo-sharing` — open native share sheet

### Files to Create/Modify
| File | Action | What |
|---|---|---|
| `utils/exportData.ts` | **Create** | Export logic: query all tables, serialize to JSON, write file, trigger share |
| `app/settings.tsx` | **Modify** | Add "Export Data" row in a new "DATA" section, with loading state |

### Acceptance Criteria
- Tapping "Export Data" generates a `gymtrack-export-YYYY-MM-DD.json` file
- Share sheet opens with the file
- Loading indicator shown during export
- Error alert if export fails
- Built-in exercises are NOT included (only `isCustom = true`)
- Export includes metadata (`exportVersion`, `exportedAt`, `appVersion`)

### Edge Cases
- Empty database (no workouts, no meals) — export succeeds with empty arrays
- Large database — export runs synchronously (SQLite is fast for reads), but file write is async
- No share targets available — OS handles this gracefully

---

## Feature 2: FlashList Migration

### Goal
Replace `ScrollView` + `.map()` rendering with `FlashList` for lists that can grow unbounded.

### Migration Targets (Priority Order)

| Screen | File | Current | Items | Priority |
|---|---|---|---|---|
| History | `app/(tabs)/history.tsx` | `ScrollView` + `.map()` | 50–500+ sessions | **High** |
| Exercise Picker | `components/workout/ExercisePickerModal.tsx` | `ScrollView` + `.map()` | 100+ exercises | **High** |
| Nutrition | `app/(tabs)/nutrition.tsx` | `ScrollView` + `.map()` | 5–20 meals/day | **Low** |
| Workout | `app/(tabs)/workout.tsx` | `ScrollView` + nested maps | 1–10 splits | **Skip** (too few items, nested structure) |

### New Dependencies
- `@shopify/flash-list` — virtualized list component

### Files to Create/Modify
| File | Action | What |
|---|---|---|
| `app/(tabs)/history.tsx` | **Modify** | Replace `ScrollView` + `.map()` with `FlashList`, extract `HistoryCard` as `renderItem`, add `estimatedItemSize` |
| `components/workout/ExercisePickerModal.tsx` | **Modify** | Replace `ScrollView` + grouped `.map()` with `FlashList` using section-style data (flat list with section headers) |

### Key Design Decisions

**History screen:**
- `FlashList` replaces the `ScrollView` wrapping `history.map(...)`
- `SwipeableRow` + `HistoryCard` become the `renderItem` component
- Header (title + subtitle) moves to `ListHeaderComponent`
- Empty state moves to `ListEmptyComponent`
- `estimatedItemSize` ~100 (collapsed card height)

**Exercise Picker:**
- Currently renders grouped exercises with section headers inside `ScrollView`
- Flatten to a single array with section header items interspersed
- Use `getItemType` to distinguish header vs exercise items
- `estimatedItemSize` ~56 (exercise row height)

### NOT Migrating (with rationale)
- **`nutrition.tsx`** — Meals per day is small (5-20 items), and the screen has a complex layout with calendar/target cards above. Low benefit.
- **`workout.tsx`** — Nested structure (splits → templates → exercises). FlashList works with flat lists. Would require significant restructuring for minimal benefit (1-10 splits).
- **`insights.tsx`** — Already uses `FlatList` in modals for small datasets. No change needed.

### Acceptance Criteria
- History screen scrolls smoothly with 100+ items
- Exercise picker scrolls smoothly with full exercise library
- No visual regressions (cards look identical before/after)
- `SwipeableRow` still works in history list
- Expandable cards still work in history list

### Risks
- **Medium:** `SwipeableRow` (gesture handler) inside `FlashList` — needs testing, may need `overrideItemLayout` if row heights vary (expanded vs collapsed)
- **Low:** `FlashList` requires `estimatedItemSize` — wrong estimate causes layout flicker on first render

---

## Feature 3: Centralize Data Fetching

### Goal
Extract duplicated database queries into `db/queries.ts` and update all consuming hooks.

### Identified Duplications

| Query Pattern | Used In | Occurrences |
|---|---|---|
| Exercise counts per template (`COUNT(*) GROUP BY templateId`) | `useWorkoutTemplates.ts` (L36-43), `useWorkoutDashboard.ts` (L135-142) | 2 |
| Last session per template (`MAX(completedAt) GROUP BY templateId`) | `useWorkoutTemplates.ts` (L49-56), `useWorkoutDashboard.ts` (L147-154) | 2 |
| Exercise details by IDs (`SELECT * FROM exercises WHERE id IN (...)`) | `useWorkoutHistory.ts` (L130-133), `ActiveWorkoutContext.tsx`, `useProgressiveOverload.ts` | 3 |
| All completed sessions ordered by date | `useWorkoutHistory.ts` (L19-23), `useWorkoutDashboard.ts` (L93-97) | 2 |
| Template exercises with joined exercise details | `useWorkoutTemplates.ts` (L220-235), `useProgressiveOverload.ts` | 2 |

### Extraction Plan

Create `db/queries.ts` with these shared query functions:

```typescript
// db/queries.ts — Centralized database query functions

// Already exists as local function in useWorkoutTemplates.ts — promote to shared
export function fetchTemplateDetails(templateIds: string[]): {
  exerciseCounts: Map<string, number>;
  lastPerformed: Map<string, Date | null>;
}

// Used in 3 places
export function fetchExercisesByIds(exerciseIds: string[]): Exercise[]

// Used in 2 places (with different filters — parameterize)
export function fetchCompletedSessions(options?: {
  since?: Date;
  limit?: number;
}): WorkoutSession[]

// Used in 2 places
export function fetchTemplateExercisesWithDetails(templateId: string): TemplateExerciseWithDetails[]

// Used in useWorkoutHistory for batch stats
export function fetchSessionSetStats(sessionIds: string[]): Map<string, SessionStats>

// Used in useWorkoutDetails for PR detection
export function fetchPreviousMaxWeights(exerciseIds: string[], beforeDate: Date): Map<string, number>
```

### Files to Create/Modify
| File | Action | What |
|---|---|---|
| `db/queries.ts` | **Create** | Shared query functions extracted from hooks |
| `hooks/useWorkoutTemplates.ts` | **Modify** | Remove local `fetchTemplateDetails`, import from `db/queries.ts` |
| `hooks/useWorkoutDashboard.ts` | **Modify** | Replace inline exercise count + last session queries with `fetchTemplateDetails` |
| `hooks/useWorkoutHistory.ts` | **Modify** | Use `fetchExercisesByIds`, `fetchSessionSetStats`, `fetchPreviousMaxWeights` |
| `contexts/ActiveWorkoutContext.tsx` | **Modify** | Use `fetchExercisesByIds` instead of inline query |
| `hooks/useProgressiveOverload.ts` | **Modify** | Use `fetchExercisesByIds`, `fetchTemplateExercisesWithDetails` |

### What NOT to Extract
- **Mutation queries** (insert/update/delete) — These are tightly coupled to their hook's business logic and don't have duplication. Leave in hooks.
- **USDA food cache queries** (`utils/foodSearch.ts`) — Domain-specific, no duplication. Leave as-is.
- **Settings queries** (`useSettings.ts`) — Simple single-row CRUD with no duplication. Leave as-is.
- **Meal tracking queries** (`useMealTracking.ts`) — No duplication with other hooks. Leave as-is.

### Acceptance Criteria
- All existing functionality works identically (no behavior change)
- No duplicate query logic remains across hooks
- `db/queries.ts` contains only pure query functions (no state, no hooks)
- Each function has a clear return type
- `npx tsc --noEmit` passes with no errors

---

## Implementation Phases

### Phase 1: Centralize Data Fetching (do first — foundational)
1. Create `db/queries.ts` with extracted query functions
2. Update `hooks/useWorkoutTemplates.ts` to use shared queries
3. Update `hooks/useWorkoutDashboard.ts` to use shared queries
4. Update `hooks/useWorkoutHistory.ts` to use shared queries
5. Update `contexts/ActiveWorkoutContext.tsx` to use shared queries
6. Update `hooks/useProgressiveOverload.ts` to use shared queries
7. Run `npx tsc --noEmit` to verify no type errors
8. Test all screens manually (workout, history, insights, dashboard)

### Phase 2: FlashList Migration
9. Install `@shopify/flash-list`
10. Migrate `app/(tabs)/history.tsx` to FlashList
11. Test history screen (scrolling, expand/collapse, swipe-to-delete)
12. Migrate `components/workout/ExercisePickerModal.tsx` to FlashList
13. Test exercise picker (search, filter, section headers, selection)

### Phase 3: Data Export
14. Install `expo-file-system` and `expo-sharing`
15. Create `utils/exportData.ts` with export logic
16. Add "Export Data" UI to `app/settings.tsx`
17. Test export with populated database
18. Test export with empty database

### Phase 4: Finalize
19. Run code-reviewer agent
20. Run security-reviewer agent
21. Update version to 1.1.0 in `app.config.ts` and `package.json`
22. Merge to main

---

## Complexity Assessment

| Feature | Complexity | Risk | Files Changed |
|---|---|---|---|
| Centralize Data Fetching | Medium | Low (pure refactor, no behavior change) | 1 new + 5 modified |
| FlashList Migration | Medium | Medium (gesture handler compat, layout estimation) | 2 modified |
| Data Export | Low | Low (new additive feature, no existing code affected) | 1 new + 1 modified |

---

**WAITING FOR CONFIRMATION**: Proceed with this plan? (yes / no / modify)
