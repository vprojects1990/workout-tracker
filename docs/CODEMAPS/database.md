# Database Architecture

> Last updated: 2026-01-26

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
│ targetRepMin        │
│ targetRepMax        │
│ targetSets          │
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
Exercises within a template with rep/set targets.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique identifier |
| templateId | TEXT (FK) | Template reference |
| exerciseId | TEXT (FK) | Exercise reference |
| orderIndex | INTEGER | Order in template |
| targetRepMin | INTEGER | Minimum target reps |
| targetRepMax | INTEGER | Maximum target reps |
| targetSets | INTEGER | Number of sets |

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

### `user_settings`
User preferences.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | TEXT (PK) | 'default' | Singleton row |
| weightUnit | TEXT | 'kg' | kg \| lbs |
| defaultRestSeconds | INTEGER | 90 | Default rest timer |
| theme | TEXT | 'system' | light \| dark \| system |

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
Fetches exercises for a specific template.

```typescript
const { exercises, loading, error } = useTemplateExercises(templateId);
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
  addTemplateExercise,
  deleteWorkoutSplit,
  deleteWorkoutTemplate,
  createFullSplit,
} = useWorkoutMutations();
```

### `useActiveWorkout()`
Manages live workout session state.

```typescript
const {
  session,
  exercises,
  setLogs,
  duration,
  logSet,
  completeWorkout,
} = useActiveWorkout(templateId);
```

### `useWorkoutHistory()`
Fetches past workout sessions.

```typescript
const { sessions, loading, error, refetch } = useWorkoutHistory();
```

### `useWorkoutDashboard()`
Dashboard data including streak, weekly stats, suggested workout.

```typescript
const { data, loading, error, refetch } = useWorkoutDashboard();
// data.thisWeek.streak, data.suggestedWorkout, etc.
```

### `useProgressiveOverload(exerciseId)`
Progress tracking and stall detection.

```typescript
const { progress, trend, suggestion } = useProgressiveOverload(exerciseId);
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
3. Runs on app startup via `DatabaseContext`

Example migration for v0.7.0:
```typescript
// Add workout_splits table
await db.run(`CREATE TABLE IF NOT EXISTS workout_splits ...`);

// Add splitId and dayOfWeek columns to workout_templates
await db.run(`ALTER TABLE workout_templates ADD COLUMN split_id TEXT ...`);
await db.run(`ALTER TABLE workout_templates ADD COLUMN day_of_week INTEGER ...`);
```
