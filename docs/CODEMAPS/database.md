# Database Architecture

> Last updated: 2026-02-07 (rev 4 -- codebase optimization refactoring)

## Technology

- **Database**: SQLite via `expo-sqlite`
- **ORM**: Drizzle ORM
- **Location**: Local device storage (no cloud sync)

## Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────┐
│  workout_splits │       │       exercises     │
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │       │ id (PK)             │
│ name            │       │ name                │
│ description     │       │ primaryMuscle       │
│ createdAt       │       │ secondaryMuscles    │
└────────┬────────┘       │ equipment           │
         │                │ isCustom            │
         │ 1:N            └──────────┬──────────┘
         │                           │
         ▼                           │
┌─────────────────────┐              │
│  workout_templates  │              │
├─────────────────────┤              │
│ id (PK)             │              │
│ splitId (FK)        │──────────────┘
│ name                │              │
│ type                │              │
│ orderIndex          │              │
│ dayOfWeek           │              │
│ createdAt           │              │
└────────┬────────────┘              │
         │                           │
         │ 1:N                       │
         ▼                           │
┌─────────────────────┐              │
│ template_exercises  │              │
├─────────────────────┤              │
│ id (PK)             │              │
│ templateId (FK)     │◄─────────────┘
│ exerciseId (FK)     │
│ orderIndex          │
│ targetRepMin?       │  (nullable)
│ targetRepMax?       │  (nullable)
│ targetSets?         │  (nullable)
└─────────────────────┘

┌─────────────────────┐       ┌─────────────────┐
│  workout_sessions   │       │    set_logs     │
├─────────────────────┤       ├─────────────────┤
│ id (PK)             │ 1:N   │ id (PK)         │
│ templateId (FK)     │──────►│ sessionId (FK)  │
│ templateName        │       │ exerciseId (FK) │
│ startedAt           │       │ setNumber       │
│ completedAt         │       │ reps            │
│ durationSeconds     │       │ weight          │
└─────────────────────┘       │ restSeconds     │
                              └─────────────────┘

┌─────────────────────┐
│    user_settings    │
├─────────────────────┤
│ id (PK)             │
│ weightUnit          │
│ defaultRestSeconds  │
│ theme               │
└─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│    meal_targets     │       │     meal_logs       │
├─────────────────────┤       ├─────────────────────┤
│ id (PK, 'default') │       │ id (PK)             │
│ calories            │       │ date (YYYY-MM-DD)   │
│ protein             │       │ name                │
│ carbs               │       │ calories            │
│ fat                 │       │ protein             │
│ updatedAt           │       │ carbs               │
└─────────────────────┘       │ fat                 │
                              │ photoFilename       │
                              │ createdAt           │
                              └─────────────────────┘

┌─────────────────────┐       ┌─────────────────────┐
│    food_cache       │       │  food_search_cache  │
├─────────────────────┤       ├─────────────────────┤
│ fdcId (PK)          │◄──────│ query (PK)          │
│ description         │  N:M  │ fdcIds (JSON)       │
│ caloriesPer100g     │       │ cachedAt            │
│ proteinPer100g      │       └─────────────────────┘
│ carbsPer100g        │
│ fatPer100g          │
│ cachedAt            │
└─────────────────────┘
```

## Tables

### `workout_splits`
Container for organizing workout templates (e.g., "4-Day Upper/Lower").

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique identifier |
| name | TEXT | Split name (e.g., "Push/Pull/Legs") |
| description | TEXT | Optional description |
| createdAt | INTEGER | Timestamp |

### `exercises`
Library of available exercises (170+ seeded).

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique identifier |
| name | TEXT | Exercise name |
| primaryMuscle | TEXT | Target muscle group |
| secondaryMuscles | TEXT | JSON array of secondary muscles |
| equipment | TEXT | barbell \| dumbbell \| cable \| machine \| bodyweight |
| isCustom | INTEGER | 0 = built-in, 1 = user-created |

**Muscle Groups**: chest, back, shoulders, biceps, triceps, forearms, quads, hamstrings, glutes, core, calves

### `workout_templates`
Saved workout routines.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique identifier |
| splitId | TEXT (FK) | Optional split reference |
| name | TEXT | Template name |
| type | TEXT | upper \| lower \| custom |
| orderIndex | INTEGER | Order within split |
| dayOfWeek | INTEGER | 0=Mon, 6=Sun (nullable) |
| createdAt | INTEGER | Timestamp |

### `template_exercises`
Exercises within a template with optional rep/set targets.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique identifier |
| templateId | TEXT (FK) | Template reference |
| exerciseId | TEXT (FK) | Exercise reference |
| orderIndex | INTEGER | Order in template |
| targetRepMin | INTEGER (nullable) | Minimum target reps (null for exercises added via edit-template) |
| targetRepMax | INTEGER (nullable) | Maximum target reps (null for exercises added via edit-template) |
| targetSets | INTEGER (nullable) | Number of sets (null for exercises added via edit-template) |

### `workout_sessions`
Completed workout sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique identifier |
| templateId | TEXT (FK) | Template reference (nullable) |
| templateName | TEXT | Denormalized name for history |
| startedAt | INTEGER | Session start timestamp |
| completedAt | INTEGER | Session end timestamp |
| durationSeconds | INTEGER | Total duration |

### `set_logs`
Individual set records within a session.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique identifier |
| sessionId | TEXT (FK) | Session reference |
| exerciseId | TEXT (FK) | Exercise reference |
| setNumber | INTEGER | Set number (1, 2, 3...) |
| reps | INTEGER | Reps performed |
| weight | REAL | Weight used |
| restSeconds | INTEGER | Rest taken after set |

### `meal_targets`
Daily macro targets (singleton row, upserted on update).

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | TEXT (PK) | 'default' | Singleton row |
| calories | INTEGER | 2000 | Daily calorie target |
| protein | INTEGER | 150 | Protein target (g) |
| carbs | INTEGER | 250 | Carbs target (g) |
| fat | INTEGER | 65 | Fat target (g) |
| updatedAt | INTEGER | - | Last update timestamp |

### `meal_logs`
Individual meal entries, keyed by date for daily grouping.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique identifier |
| date | TEXT | Date key (YYYY-MM-DD) |
| name | TEXT | Meal name |
| calories | INTEGER | Calories |
| protein | REAL | Protein (g) |
| carbs | REAL | Carbs (g) |
| fat | REAL | Fat (g) |
| photoFilename | TEXT | Photo filename (nullable), stored in meal-photos/ |
| createdAt | INTEGER | Creation timestamp |

### `user_settings`
User preferences.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | TEXT (PK) | 'default' | Singleton row |
| weightUnit | TEXT | 'kg' | kg \| lbs |
| defaultRestSeconds | INTEGER | 90 | Default rest timer |
| theme | TEXT | 'system' | light \| dark \| system |

### `food_cache`
Cached USDA food nutrient data (per 100g). Populated on search, expires after 30 days.

| Column | Type | Description |
|--------|------|-------------|
| fdcId | INTEGER (PK) | USDA FoodData Central ID |
| description | TEXT | Food name/description |
| caloriesPer100g | REAL | Calories per 100g |
| proteinPer100g | REAL | Protein per 100g (g) |
| carbsPer100g | REAL | Carbs per 100g (g) |
| fatPer100g | REAL | Fat per 100g (g) |
| cachedAt | INTEGER | Cache timestamp (ms) |

### `food_search_cache`
Maps search queries to cached food result IDs. Enables offline-first search.

| Column | Type | Description |
|--------|------|-------------|
| query | TEXT (PK) | Normalized search query (lowercased, trimmed) |
| fdcIds | TEXT | JSON array of fdcId integers (preserves order) |
| cachedAt | INTEGER | Cache timestamp (ms) |

## Custom Hooks

### `useWorkoutSplits()`
Fetches all splits with their templates.

```typescript
const { splits, standaloneTemplates, loading, error, refetch } = useWorkoutSplits();
```

Returns:
- `splits`: Array of splits with nested templates
- `standaloneTemplates`: Templates without a split

### `useWorkoutTemplates()`
Fetches all templates (flat list).

```typescript
const { templates, loading, error, refetch } = useWorkoutTemplates();
```

### `useTemplateExercises(templateId)`
Fetches exercises for a specific template. Accepts `string | null` to support conditional loading.

```typescript
const { exercises, loading, error, refetch } = useTemplateExercises(templateId);
// exercises: TemplateExerciseWithDetails[] (includes nullable targetRepMin/Max/Sets)
```

### `useAllExercises()`
Fetches the complete exercise library.

```typescript
const { exercises, loading, error } = useAllExercises();
```

### `useWorkoutMutations()`
CRUD operations for splits and templates.

```typescript
const {
  createWorkoutSplit,
  createWorkoutTemplate,
  addTemplateExercise,          // targetSets/RepMin/RepMax are now optional (nullable)
  deleteWorkoutSplit,
  deleteWorkoutTemplate,
  createFullSplit,              // ExerciseInput targets are now optional
  replaceTemplateExercises,     // Batch replace: DELETE all + INSERT new (transactional)
} = useWorkoutMutations();
```

#### `replaceTemplateExercises(templateId, exercises)`
Replaces all exercises in a template atomically within a transaction. Deletes all existing `template_exercises` rows for the given template and inserts the new list with correct `orderIndex` values. Used by the edit-template screen.

```typescript
await replaceTemplateExercises(templateId, [
  { exerciseId: 'exercise-1' },
  { exerciseId: 'exercise-2' },
]);
```

### `useActiveWorkout()` (via `ActiveWorkoutContext`)
Live workout session state is managed by `ActiveWorkoutContext` (not a standalone hook). Types (`ActiveSetData`, `ExerciseSettings`, `WorkoutExercise`) are imported from `@/types`.

```typescript
const {
  activeWorkout,
  hasActiveWorkout,
  startWorkout,
  logSet,
  completeWorkout,
  // ... see ActiveWorkoutContext.tsx for full API
} = useActiveWorkout();
```

### `useWorkoutHistory()`
Fetches past workout sessions. Types (`WorkoutHistoryItem`, `ExerciseDetail`) are imported from and re-exported via `@/types`.

```typescript
const { history, loading, error, refetch } = useWorkoutHistory();
// Also exports: getSessionExercises(sessionId) for detail drill-down
```

### `useWorkoutDashboard()`
Dashboard data including streak, weekly stats, suggested workout. Date helpers imported from `@/utils/dates`.

```typescript
const { data, loading, error, refetch } = useWorkoutDashboard();
// data.thisWeek.streak, data.suggestedWorkout, etc.
```

### `useProgressiveOverload(exerciseId)`
Progress tracking and stall detection.

```typescript
const { progress, trend, suggestion } = useProgressiveOverload(exerciseId);
```

### `useMealTracking(selectedDate, weekOffset)`
Full meal tracking: daily meals, macro targets, and weekly adherence summary.

```typescript
const {
  meals,          // MealLog[] for selected date
  targets,        // MealTarget | null (daily macro targets)
  totals,         // MacroTotals (computed sum of meals)
  weekSummary,    // WeekDaySummary[] (Mon-Fri adherence)
  loading,
  error,
  addMeal,        // (input: MealInput) => Promise<void>
  updateMeal,     // (id, partial) => Promise<void>
  deleteMeal,     // (id) => Promise<void>  (also deletes photo)
  updateTargets,  // (targets) => Promise<void>  (upsert)
  refetch,
} = useMealTracking(selectedDate, weekOffset);
```

Exported pure functions for testing: `computeMacroTotals()`, `getAdherenceStatus()`.

### `useFoodSearch()`
Debounced USDA food search with loading/error state.

```typescript
const { query, results, loading, error, search, clear } = useFoodSearch();
// search(text) - debounced (400ms), calls searchFoods() from utils/foodSearch
// results: FoodItem[] - foods with per-100g nutrient data
// clear() - resets state
```

### `useSettings()`
User preferences CRUD.

```typescript
const { settings, updateSettings, loading } = useSettings();
```

## Seed Data

The app seeds 170+ exercises across 11 muscle groups and 5 equipment types:

| Muscle Group | Count |
|--------------|-------|
| Chest | 23 |
| Back | 22 |
| Shoulders | 26 |
| Biceps | 18 |
| Triceps | 14 |
| Forearms | 14 |
| Quads | 21 |
| Hamstrings | 13 |
| Glutes | 22 |
| Core | 6 |
| Calves | 11 |

## Migrations

Database migrations are handled in `db/migrations.ts`. The migration system:

1. Creates tables if they don't exist
2. Adds new columns for schema updates
3. Recreates tables when column constraints change (SQLite has no ALTER COLUMN)
4. Runs on app startup via `DatabaseContext`

### Migration History

**v0.7.0** - Splits support:
```typescript
// Add workout_splits table
await db.run(`CREATE TABLE IF NOT EXISTS workout_splits ...`);

// Add splitId and dayOfWeek columns to workout_templates
await db.run(`ALTER TABLE workout_templates ADD COLUMN split_id TEXT ...`);
await db.run(`ALTER TABLE workout_templates ADD COLUMN day_of_week INTEGER ...`);
```

**v0.11.0** - Nullable target columns:
```typescript
// Make target_rep_min, target_rep_max, target_sets nullable in template_exercises
// SQLite does not support ALTER COLUMN, so the table is recreated:
// 1. PRAGMA table_info() to check if migration is needed (notnull === 1)
// 2. CREATE TABLE template_exercises_new (with nullable target columns)
// 3. INSERT INTO ... SELECT FROM template_exercises (preserve existing data)
// 4. DROP TABLE template_exercises
// 5. ALTER TABLE template_exercises_new RENAME TO template_exercises
// All wrapped in a manual BEGIN/COMMIT transaction with ROLLBACK on error
```
