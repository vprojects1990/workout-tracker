# Architecture: Workout Split Exercise Editing & Default Sets/Reps Removal

## Status: ARCHITECTURE - Ready for Review
## Date: 2026-02-06
## Requirements: docs/plans/workout-split-editing.md

---

## 1. Current State Analysis

### 1.1 Relevant Schema (change needed)

The `template_exercises` table in `db/schema.ts` declares `targetRepMin`, `targetRepMax`, and `targetSets` as `.notNull()`. The requirements document assumed these were nullable — this is incorrect. A schema update is required.

### 1.2 Existing Mutations (`useWorkoutMutations()`)

| Mutation | Purpose |
|----------|---------|
| `createWorkoutSplit()` | Creates a split container |
| `createWorkoutTemplate()` | Creates a template within a split |
| `addTemplateExercise()` | Adds a single exercise with required sets/reps args |
| `deleteWorkoutSplit()` | Cascade deletes split + templates + exercises |
| `deleteWorkoutTemplate()` | Cascade deletes template + exercises |
| `createFullSplit()` | Transactional creation of split + templates + exercises |

**Missing**: No mutations for updating or replacing exercises within an existing template.

### 1.3 Route Structure

```
(tabs)/workout.tsx     -- Dashboard (tab)
workout/create-split   -- Split creation wizard (modal)
workout/[id]           -- Active workout screen (modal)
workout/empty          -- Empty workout screen (modal)
```

All non-tab routes use `presentation: 'modal'`.

### 1.4 Component Reuse Candidates

The Exercise Picker Modal is duplicated across three files:
- `app/workout/create-split.tsx`
- `app/workout/[id].tsx`
- `app/workout/empty.tsx`

Each contains the same search/filter/group-by-muscle logic. This is technical debt to address.

---

## 2. System Design

### 2.1 Screen & Navigation Architecture

**Decision**: New dedicated screen at `app/workout/edit-template.tsx` presented as a modal.

```
Route:    /workout/edit-template?templateId=xxx
Params:   templateId (string, required)
Present:  Modal (consistent with existing screens)
```

**Rationale**: The `create-split.tsx` wizard is a 3-step flow for creating entire splits. The edit screen only needs the Exercises step for a single template. A dedicated screen is simpler and avoids coupling create/edit flows.

### 2.2 High-Level Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  WORKOUT DASHBOARD (workout.tsx)                                 │
│                                                                  │
│  SplitContainer                                                  │
│    ├─ TemplateCard [Mon Push] ── [Edit] button ──────┐          │
│    ├─ TemplateCard [Wed Pull]                         │          │
│    └─ TemplateCard [Fri Legs]                         │          │
│                                                       ▼          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  EDIT TEMPLATE SCREEN (edit-template.tsx) — Modal           │ │
│  │                                                             │ │
│  │  1. Load: useTemplateExercises(templateId)                  │ │
│  │     └─ DB query → TemplateExerciseWithDetails[]             │ │
│  │                                                             │ │
│  │  2. Local State: exercises[] (copy of loaded data)          │ │
│  │     ├─ Add exercise (via ExercisePickerModal)               │ │
│  │     ├─ Remove exercise (swipe-to-delete or button)          │ │
│  │     └─ Reorder exercises (move up/down buttons)             │ │
│  │                                                             │ │
│  │  3. Save: replaceTemplateExercises(templateId, exercises[]) │ │
│  │     └─ Transaction: DELETE all → INSERT all with new order  │ │
│  │                                                             │ │
│  │  4. Cancel: Discard local state → router.back()             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Dashboard refetches on focus → exercise counts update           │
└──────────────────────────────────────────────────────────────────┘
```

### 2.3 Component Architecture

```
app/workout/edit-template.tsx
├── Header (Cancel | Template Name | Save)
├── ExerciseList
│   ├── EditableExerciseRow (for each exercise)
│   │   ├── Exercise name + equipment badge
│   │   ├── Move Up / Move Down buttons
│   │   └── Delete button
│   └── "Add Exercise" button
└── ExercisePickerModal (extracted shared component)

components/workout/ExercisePickerModal.tsx  [NEW - extracted]
├── Search bar
├── Grouped exercise list by muscle
└── onSelect callback
```

---

## 3. Mutation Design

### 3.1 ADR-001: Batch Replace vs. Granular CRUD

#### Option A: Batch Replace (RECOMMENDED)

A single mutation `replaceTemplateExercises(templateId, exercises[])` that:
1. Opens a transaction
2. DELETEs all existing `template_exercises` rows for the given `templateId`
3. INSERTs new rows from the provided array with correct `orderIndex` values

**Pros**:
- Single mutation to implement and test
- Transactional — all-or-nothing, no partial states
- Naturally handles add, remove, and reorder in one operation
- Simpler local state — just maintain an array, save the whole thing

**Cons**:
- Slightly less efficient (deletes and re-inserts unchanged exercises)
- Loses original `template_exercises.id` values (new IDs generated)

**Why the cons don't matter**:
- Template exercise lists are small (4-8 items) — performance negligible
- No other table references `template_exercises.id` as a FK
- `set_logs` references `exercises.id` (the library entry), not `template_exercises.id`

#### Option B: Granular CRUD (NOT RECOMMENDED)

Three separate mutations: add, remove, reorder — more complex, more error-prone, no real benefit for small lists.

**Decision: Batch Replace (Option A).**

### 3.2 Updated Mutation Signatures

Existing `addTemplateExercise` and `createFullSplit` will have `targetSets/RepMin/RepMax` become optional (nullable) parameters.

---

## 4. State Management

### 4.1 Edit Screen Local State

```typescript
const { exercises: loadedExercises, loading } = useTemplateExercises(templateId);
const [editedExercises, setEditedExercises] = useState<EditableExercise[]>([]);
const [isDirty, setIsDirty] = useState(false);
```

### 4.2 Why Local State (Not Context)

- Single-screen, single-session operation
- No other screens need to observe the in-progress edit
- Cancellation is trivial — navigate back, state is discarded

### 4.3 Discard Confirmation

When `isDirty === true` and user taps Cancel, show a confirmation alert. When `isDirty === false`, navigate back immediately.

### 4.4 Save Flow

Save → Validate → `replaceTemplateExercises()` → Success: `router.back()` → Dashboard auto-refetches via `useFocusEffect`

---

## 5. UI Entry Point

### 5.1 Edit Button Placement

**Decision**: Add a pencil/edit icon to each `TemplateCard` in the `SplitContainer` component.

Current layout:
```
[Day Badge] Template Name       Last Performed
            X exercises
```

Updated layout:
```
[Day Badge] Template Name   [Edit icon]  Last Performed
            X exercises
```

The edit icon (`pencil-outline`, 18px, textTertiary color) navigates to `/workout/edit-template?templateId={id}`.

---

## 6. Default Sets/Reps Removal

### 6.1 Schema Change Required

```typescript
// BEFORE (current)
targetRepMin: integer('target_rep_min').notNull(),
targetRepMax: integer('target_rep_max').notNull(),
targetSets: integer('target_sets').notNull(),

// AFTER
targetRepMin: integer('target_rep_min'),
targetRepMax: integer('target_rep_max'),
targetSets: integer('target_sets'),
```

Since this is a local SQLite database and the app uses push mode, update the schema definition. SQLite is dynamically typed and existing rows with values are preserved.

### 6.2 Change Map

| File | Change |
|------|--------|
| `db/schema.ts` | Remove `.notNull()` from target columns |
| `app/workout/create-split.tsx` | Remove hardcoded `targetSets: 3, targetRepMin: 8, targetRepMax: 12` |
| `app/workout/create-split.tsx` | Remove sets/reps input row from exercise cards in step 3 |
| `app/workout/create-split.tsx` | Remove `updateExercise` function (no longer needed) |
| `hooks/useWorkoutTemplates.ts` | Make target params optional in `addTemplateExercise` |
| `hooks/useWorkoutTemplates.ts` | Make targets optional in `ExerciseInput` type and `createFullSplit` |
| `hooks/useWorkoutTemplates.ts` | Update `TemplateExerciseWithDetails` type to allow null |

### 6.3 Backward Compatibility

- Existing rows with 3/8/12 values are untouched
- Active workout screen (`[id].tsx`) does not use target values — it only uses `exerciseId`, `name`, `equipment`
- No regression risk

### 6.4 Simplified Create-Split Exercise Card

After (clean):
```
┌─────────────────────────────────────┐
│  Barbell Bench Press           [X]  │
│  Barbell                            │
└─────────────────────────────────────┘
```

Before (current, with defaults):
```
┌─────────────────────────────────────┐
│  Barbell Bench Press           [X]  │
│  Barbell                            │
│  [3] sets x [8] - [12] reps        │
└─────────────────────────────────────┘
```

---

## 7. Extracted Exercise Picker Modal

### 7.1 Rationale

Currently duplicated 3x. The edit screen would make it 4x. Extract to shared component.

### 7.2 Component Design

New file: `components/workout/ExercisePickerModal.tsx`

```typescript
type ExercisePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: { id: string; name: string; equipment: string; primaryMuscle: string }) => void;
};
```

Uses `useAllExercises()` internally. Contains search bar, filter, group-by-muscle logic.

---

## 8. Reorder Strategy

### 8.1 ADR-002: Drag-and-Drop vs. Move Buttons

**Decision: Move Up/Down Buttons for V1.**

- Simple to implement (swap indices in array)
- No new dependencies
- Adequate for typical 4-8 exercise lists
- Drag-and-drop can be a future enhancement

---

## 9. Active Workout Conflict Handling

**Edits apply to the template only, not to the active workout session.**

The active workout screen copies template exercises into `ActiveWorkoutContext` at initialization. After that, the active workout is independent of the template. Editing a template while a workout is in progress is safe — the in-progress workout retains its original exercise list.

No special blocking or handling required.

---

## 10. Files to Create

| File | Purpose |
|------|---------|
| `app/workout/edit-template.tsx` | Edit template exercises screen |
| `components/workout/ExercisePickerModal.tsx` | Extracted shared exercise picker |

## 11. Files to Modify

| File | Changes |
|------|---------|
| `db/schema.ts` | Make target columns nullable |
| `hooks/useWorkoutTemplates.ts` | Add `replaceTemplateExercises`; make target params optional |
| `app/workout/create-split.tsx` | Remove defaults + sets/reps UI; use shared picker |
| `app/(tabs)/workout.tsx` | Add edit button to `TemplateCard` |
| `app/_layout.tsx` | Register `workout/edit-template` route |
| `app/workout/[id].tsx` | Use shared `ExercisePickerModal` (refactor only) |
| `app/workout/empty.tsx` | Use shared `ExercisePickerModal` (refactor only) |

---

## 12. Technical Trade-off Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Edit screen approach | New dedicated screen | Simpler than adapting 3-step wizard |
| Presentation | Modal | Consistent with all other non-tab screens |
| Mutation strategy | Batch replace | Simplest, transactional, small data sets |
| Reorder mechanism | Move up/down buttons (V1) | No new dependencies, adequate for list size |
| Exercise picker | Extract to shared component | Eliminates 4-way duplication |
| State management | Local component state | Single-screen operation |
| Default removal | Schema change + UI removal | Columns need to become nullable |
| Active workout conflict | No blocking needed | Active workout is independent after init |

---

## 13. Visual Mockup

### Edit Template Screen

```
┌─────────────────────────────────────┐
│  Cancel     Mon Push          Save  │
├─────────────────────────────────────┤
│                                     │
│  1. Barbell Bench Press             │
│     Barbell            [^] [v] [X]  │
│                                     │
│  2. Incline Dumbbell Press          │
│     Dumbbell           [^] [v] [X]  │
│                                     │
│  3. Cable Fly                       │
│     Cable              [^] [v] [X]  │
│                                     │
│  4. Tricep Pushdown                 │
│     Cable              [^] [v] [X]  │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  (+) Add Exercise               ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## 14. Testing Strategy

| Area | Approach |
|------|----------|
| `replaceTemplateExercises` | Verify transaction deletes old and inserts new rows correctly |
| Schema nullable columns | Verify existing data preserved; new inserts with null succeed |
| Edit screen | Manual test: load, add, remove, reorder, save, cancel |
| Backward compatibility | Existing splits with 3x8-12 still render correctly |
| Exercise picker extraction | No regressions in create-split, active workout, empty workout |
| Default removal | Create-split no longer shows sets/reps; new exercises have null targets |
