# Feature: Workout Split Exercise Editing & Default Sets/Reps Removal

## Status: REQUIREMENTS - Awaiting Approval

## Feature Overview

Two related changes to the workout split system:

1. **Primary**: Allow users to edit exercises within individual days of a saved workout split
2. **Secondary**: Remove auto-populated default sets/reps (3x8-12) when adding exercises

---

## Problem Statement

### Problem 1: No Edit Capability for Saved Splits

After a user creates and saves a workout split, there is **no way to modify the exercises** assigned to any day. The only options are:
- Delete the entire split and recreate it
- Delete an individual day (template) and lose all exercise data

**Example**: A user sets up a 3-day Full Body split across Monday, Wednesday, and Friday. If they want to swap Barbell Bench Press for Dumbbell Bench Press on Monday, they must delete the entire split or the Monday template and start over.

**Impact**: High friction for users iterating on their training program. Most users adjust exercises frequently based on equipment availability, progression, injury, or preference.

### Problem 2: Unnecessary Default Sets/Reps

When adding an exercise (during split creation or free form), the system auto-populates:
- `targetSets: 3`
- `targetRepMin: 8`
- `targetRepMax: 12`

These defaults are:
- Not configurable after being set
- Redundant — when starting a workout, the user inputs actual sets/reps anyway
- Potentially misleading — not all exercises follow a 3x8-12 scheme (e.g., deadlifts 5x5, planks for time)

---

## User Stories

### Split Editing (Primary)

**US-1**: As a user, I want to tap on a workout day within my saved split and edit the exercises so I can adjust my training program without recreating the entire split.

**US-2**: As a user, I want to add new exercises to an existing workout day so I can expand my routine over time.

**US-3**: As a user, I want to remove exercises from an existing workout day so I can simplify or change my routine.

**US-4**: As a user, I want to reorder exercises within a workout day so I can adjust my exercise sequence.

### Default Sets/Reps Removal (Secondary)

**US-5**: As a user, I want exercises added to a split to have no pre-set targets so I can define my own sets and reps during the workout.

**US-6**: As a user adding exercises in free form or split mode, I expect a clean slate with no assumptions about my training parameters.

---

## Acceptance Criteria

### Split Editing

- [ ] **AC-1**: Each workout day (template) within a split has an edit action accessible from the workout dashboard
- [ ] **AC-2**: Tapping edit on a template opens an edit screen showing all current exercises for that day
- [ ] **AC-3**: User can add new exercises via the existing exercise picker modal
- [ ] **AC-4**: User can remove existing exercises (swipe to delete or delete button)
- [ ] **AC-5**: User can reorder exercises (drag or move up/down)
- [ ] **AC-6**: Changes are saved to the database when the user confirms
- [ ] **AC-7**: Cancelling edit discards all unsaved changes
- [ ] **AC-8**: The workout dashboard reflects updated exercise counts after editing

### Default Sets/Reps Removal

- [ ] **AC-9**: Adding an exercise during split creation sets `targetSets`, `targetRepMin`, and `targetRepMax` to `null` (or omits them)
- [ ] **AC-10**: The split creation UI no longer shows pre-filled 3/8/12 values for new exercises
- [ ] **AC-11**: The template_exercises database records store null for target fields when no values are specified
- [ ] **AC-12**: Active workouts still allow users to add sets and input reps/weight as before (no regression)
- [ ] **AC-13**: Existing saved splits with 3x8-12 values continue to work (backward compatibility)

---

## Edge Cases

1. **Empty day after editing**: User removes all exercises from a day — should show an empty state with prompt to add exercises
2. **Duplicate exercises**: User tries to add the same exercise twice to a day — allow it (some programs repeat exercises, e.g., opener and closer sets)
3. **Active workout conflict**: User tries to edit a template while an active workout is using it — edits should apply to future workouts only, not the in-progress session
4. **Database schema**: `targetSets`, `targetRepMin`, `targetRepMax` columns in `template_exercises` already accept `null` values (they use `.default(null)` in the schema) — no migration needed
5. **Existing data**: Previously saved splits with 3x8-12 defaults remain untouched — only new exercises get null targets

---

## Scope

### In Scope
- Edit exercises within a saved workout day (add, remove, reorder)
- New edit screen/modal for template exercises
- Update mutations in `useWorkoutTemplates` hook
- Remove default 3x8-12 from exercise creation
- UI updates to dashboard and split creation wizard

### Out of Scope (Future Work)
- Editing split name/description after creation
- Adding/removing days from an existing split
- Duplicating/copying splits
- Sharing splits with other users
- Exercise set/rep targets as optional configurable fields

---

## Technical Context

### Key Files
| File | Role |
|------|------|
| `db/schema.ts` | Database schema — `template_exercises` table |
| `hooks/useWorkoutTemplates.ts` | All CRUD mutations — needs new update functions |
| `app/workout/create-split.tsx` | Split creation wizard — default 3x8-12 at lines 118-120 |
| `app/(tabs)/workout.tsx` | Dashboard — `TemplateCard` and `SplitContainer` components |
| `contexts/ActiveWorkoutContext.tsx` | Active workout — should not be affected |

### Current Mutations Available
- `createFullSplit()` — creates split + templates + exercises in one transaction
- `createWorkoutTemplate()` — creates standalone template
- `deleteWorkoutSplit()` — cascade deletes split
- `deleteWorkoutTemplate()` — cascade deletes template

### Mutations Needed
- `updateTemplateExercises(templateId, exercises[])` — replace exercises for a template
- Or granular: `addTemplateExercise()`, `removeTemplateExercise()`, `reorderTemplateExercises()`

### Database Schema Notes
- `template_exercises.targetSets` — integer, nullable, default null
- `template_exercises.targetRepMin` — integer, nullable, default null
- `template_exercises.targetRepMax` — integer, nullable, default null
- No schema migration needed — columns already support null

---

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Should we allow editing the split name/description? | No — out of scope for this change |
| Should we allow adding/removing days from a split? | No — out of scope |
| Should removing default sets/reps also remove the input fields during creation? | Yes — remove the fields entirely since targets are not needed at creation time |
| What about exercises already saved with 3x8-12? | Leave them as-is — backward compatible |
