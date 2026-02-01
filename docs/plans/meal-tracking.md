# Meal Tracking Feature - Requirements & Plan

## Overview

Add a meal logging feature to track daily nutrition alongside training data. The user is on a **4-week structured meal plan service** where all macros are known in advance. This is an **MVP/testing implementation** designed to be expanded later.

---

## Goals

1. Log meals eaten each day (Monday–Friday only)
2. Record macros per meal (calories, protein, carbs, fat)
3. Optionally attach a photo of the food
4. View daily macro totals and progress toward targets
5. Keep it simple — no food database, no barcode scanning, no AI recognition

## Non-Goals (Future Expansion)

- Weekend tracking
- Food database / search
- AI meal recognition from photos
- Barcode scanning
- Recipe builder
- Meal plan templates / recurring meals
- Sharing or export

---

## User Stories

### US-1: Set Daily Macro Targets
**As a user**, I want to set my daily macro targets (calories, protein, carbs, fat) so I can see progress against my meal plan.

**Acceptance Criteria:**
- Can set targets for: calories (kcal), protein (g), carbs (g), fat (g)
- Targets persist across sessions
- Can update targets at any time

### US-2: Log a Meal
**As a user**, I want to log a meal with its name and macros so I can track what I've eaten.

**Acceptance Criteria:**
- Can enter: meal name (e.g., "Meal 1 - Chicken & Rice"), calories, protein, carbs, fat
- All macro fields are numeric inputs
- Meal is associated with the current date
- Can only log meals on weekdays (Mon–Fri)
- Confirmation haptic on save

### US-3: Attach a Meal Photo (Optional)
**As a user**, I want to optionally attach a photo of my meal for visual reference.

**Acceptance Criteria:**
- Photo is optional — meal can be logged without one
- Can pick from photo library or take a new photo
- Photo preview shown before saving
- Photo stored locally on device (file path in SQLite)
- Can view photo in meal detail

### US-4: View Daily Meal Summary
**As a user**, I want to see all meals logged for a given day with macro totals and progress rings.

**Acceptance Criteria:**
- Shows list of meals logged for selected day
- Shows macro totals (sum of all meals)
- Shows progress rings/bars for each macro vs. daily target
- Can navigate between weekdays (Mon–Fri) of current week
- Shows meal photo thumbnails if attached

### US-5: Edit or Delete a Meal
**As a user**, I want to edit or delete a logged meal if I made an error.

**Acceptance Criteria:**
- Can swipe to delete (using existing SwipeableRow pattern)
- Can tap to edit any field
- Totals update immediately on edit/delete

### US-6: Weekly Overview
**As a user**, I want to see a weekly summary of my macro adherence.

**Acceptance Criteria:**
- Shows Mon–Fri with completion indicators (logged vs. not)
- Shows daily calorie totals for the week
- Color-coded: green (within target range), yellow (close), red (missed/over)

---

## Edge Cases

1. **No meals logged for a day** — Show empty state with prompt to add first meal
2. **Weekend navigation** — Weekends are greyed out / not selectable
3. **Past dates** — Can log meals for past weekdays (within current week)
4. **Future dates** — Cannot log meals for future dates
5. **Photo storage** — Store relative filename, reconstruct path at runtime (iOS sandbox path changes)
6. **Large photos** — Compress to quality 0.7, max dimension 1024px
7. **Zero macro values** — Allow (e.g., black coffee = 0 cal is valid but unlikely in meal plan context)
8. **Multiple weeks** — For MVP, focus on current week only; can browse past weeks but not future

---

## UI/UX Design Direction

### Research-Informed Decisions

Based on research of leading meal tracking apps ([MyFitnessPal](https://www.myfitnesspal.com/), [MacroFactor](https://macrofactorapp.com/), [Yazio](https://www.yazio.com/), [Lose It!](https://www.loseit.com/)):

1. **Circular progress rings** for macro visualization (Apple Activity Rings style)
   - Reference: [react-native-circular-progress](https://github.com/bartgryszko/react-native-circular-progress) or custom SVG with Reanimated
   - Reference: [simple-calorie-tracker](https://github.com/antomanc/simple-calorie-tracker) open-source React Native app

2. **Daily diary view** as the primary screen — list of meals with running totals at top

3. **Quick-add flow** — Minimal taps to log a meal:
   - Tap "+" → Enter name → Enter macros → Optional photo → Save
   - Use numeric keyboard for macro inputs

4. **Day selector** — Horizontal weekday strip (Mon–Fri) at top of screen, similar to existing `WeekCalendar` component

5. **Reduce tracking fatigue** — Since macros are known from meal plan, consider a "quick entry" mode where user just selects a meal slot (Meal 1, 2, 3, etc.)

### Navigation Placement

**Option A (Recommended): New tab** — Add "Nutrition" tab to bottom navigation alongside Workout, History, Insights.

**Option B: Sub-screen** — Accessible from dashboard as a card/widget.

Recommendation: **Option A** — a dedicated tab gives the feature equal weight with training and makes daily logging frictionless.

### Component Reuse

Leverage existing codebase patterns:
- `Card` component for meal entries
- `Input` component for macro fields
- `SwipeableRow` for delete gesture
- `WeekCalendar`-style day picker for weekday navigation
- `expo-image-picker` (already in use in feedback.tsx)
- Haptic patterns from `utils/haptics.ts`
- Themed components for dark/light mode

---

## Technical Approach (High-Level)

### Database

New tables in SQLite via Drizzle ORM:

- **`meal_targets`** — Daily macro targets (calories, protein, carbs, fat)
- **`meal_logs`** — Individual meal entries with date, name, macros, optional photo path

### Image Storage

Per [Expo best practices](https://docs.expo.dev/versions/latest/sdk/imagepicker/):
- Pick image with `expo-image-picker`
- Copy to `FileSystem.documentDirectory` for persistence
- Store **relative filename only** in SQLite (iOS sandbox path changes between launches)
- Reconstruct full path at runtime

### New Files (Estimated)

| Category | Files |
|----------|-------|
| Schema | `db/schema.ts` (extend) |
| Migration | `db/migrations.ts` (extend) |
| Hook | `hooks/useMealTracking.ts` |
| Screen | `app/(tabs)/nutrition.tsx` |
| Components | `components/nutrition/MealCard.tsx`, `MacroRings.tsx`, `DaySelector.tsx`, `MealForm.tsx` |

---

## Open Questions (Resolved)

| Question | Resolution |
|----------|-----------|
| Track weekends? | No — Mon–Fri only for MVP |
| Food database needed? | No — manual entry only, macros known from meal plan |
| Store photos in DB or filesystem? | Filesystem (path in DB) |
| Meal categories (breakfast/lunch/dinner)? | No — just numbered meals or custom names |
| Sync to cloud? | No — local only for MVP |
| Calorie vs macro focus? | Both — track all four (cal, protein, carbs, fat) |

---

## Sources

- [Expo ImagePicker Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Expo FileSystem Documentation](https://docs.expo.dev/versions/v52.0.0/sdk/filesystem/)
- [react-native-circular-progress](https://github.com/bartgryszko/react-native-circular-progress)
- [simple-calorie-tracker (open-source RN app)](https://github.com/antomanc/simple-calorie-tracker)
- [ReanimatedArc by Callstack](https://www.callstack.com/blog/reanimatedarc-build-circular-animated-ui-elements-in-react-native)
- [Animated Progress Ring Tutorial](https://www.notjust.dev/projects/step-counter/animated-progress-ring)
- [Best Food Tracking Apps 2025](https://fitia.app/learn/article/best-food-tracking-apps-2025-complete-guide/)
- [How to Create a Nutrition Tracking App](https://ripenapps.com/blog/how-to-create-the-best-nutrition-tracking-app/)
