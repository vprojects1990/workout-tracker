# Workout Tracker - Architecture Overview

> Version 1.0.0 | Last updated: 2026-02-07

## Project Overview

Workout Tracker is a React Native workout tracking application built with Expo. It provides workout template management (including split exercise editing), live session tracking, progressive overload monitoring, workout history analysis, meal/nutrition tracking, and USDA food search with weight-based macro estimation. The codebase follows a modular architecture with centralized types, date utilities, label constants, and reusable animation hooks.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile App (Expo)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Screens   │  │  Components │  │       Hooks         │  │
│  │  (app/*)    │  │             │  │  (data management)  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │                                   │
│                   ┌──────▼──────┐                            │
│                   │  Drizzle ORM │                           │
│                   └──────┬──────┘                            │
│                          │                                   │
│                   ┌──────▼──────┐                            │
│                   │   SQLite    │                            │
│                   │  (local DB) │                            │
│                   └─────────────┘                            │
│                          │                                   │
│                   ┌──────▼──────┐                            │
│                   │ Food Cache  │  (USDA search results)     │
│                   └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
                     │              │
              Feedback API    USDA FoodData
                     │         Central API
                     ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Functions                          │
│                   (workout-tracker-api)                      │
│                           │                                  │
│                           ▼                                  │
│                    GitHub Issues                             │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
workout-tracker/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout with providers
│   ├── index.tsx                # Redirect to tabs
│   ├── (tabs)/                  # Tab navigation
│   │   ├── _layout.tsx          # Tab bar configuration
│   │   ├── workout.tsx          # Workout dashboard (home)
│   │   ├── history.tsx          # Workout history list
│   │   ├── nutrition.tsx        # Meal / nutrition tracking
│   │   └── insights.tsx         # Progress & analytics
│   ├── workout/                 # Workout-related modals
│   │   ├── [id].tsx             # Active workout session
│   │   ├── empty.tsx            # Empty workout (no template)
│   │   ├── create-split.tsx     # Create split wizard
│   │   └── edit-template.tsx    # Edit template exercises
│   ├── settings.tsx             # App settings
│   └── feedback.tsx             # Bug report / feedback form
├── components/                   # Reusable components
│   ├── ui/                      # Base UI primitives (Button, Card use usePressScale)
│   ├── dashboard/               # Dashboard widgets
│   ├── workout/                 # Workout session & exercise picker components
│   ├── nutrition/               # Meal tracking components
│   ├── animations/              # Animation components
│   └── wizard/                  # Multi-step form components
├── constants/                    # Design tokens & label maps
│   ├── Colors.ts                # Color palette (light/dark)
│   ├── Typography.ts            # Font styles
│   ├── Spacing.ts               # Spacing scale
│   ├── Shadows.ts               # Shadow definitions
│   └── Labels.ts                # EQUIPMENT_LABELS lookup map
├── types/                        # Shared TypeScript types
│   ├── index.ts                 # Barrel export for all types
│   └── workout.ts               # SetData, ActiveSetData, WorkoutExercise, etc.
├── contexts/                     # React contexts
│   ├── ActiveWorkoutContext.tsx # Workout persistence & resume
│   ├── DatabaseContext.tsx      # Database initialization
│   └── ThemeContext.tsx         # Theme management
├── db/                          # Database layer
│   ├── index.ts                 # Database instance
│   ├── schema.ts                # Drizzle schema definitions
│   ├── migrations.ts            # Schema migrations
│   └── seed.ts                  # Seed data (170+ exercises)
├── hooks/                       # Custom React hooks
│   ├── useWorkoutTemplates.ts   # Template & split management
│   ├── useWorkoutHistory.ts     # Past sessions (types from @/types)
│   ├── useWorkoutDashboard.ts   # Dashboard data (dates from @/utils/dates)
│   ├── useProgressiveOverload.ts # Progress tracking
│   ├── useMealTracking.ts       # Meal CRUD, targets & weekly summary
│   ├── useFoodSearch.ts         # Debounced USDA food search hook
│   ├── usePressScale.ts         # Reanimated press-scale animation hook
│   ├── useSettings.ts           # User preferences
│   ├── useAppState.ts           # App state tracking
│   └── __tests__/               # Unit tests
│       ├── convertWeight.test.ts
│       ├── determineStatus.test.ts
│       └── useWorkoutDashboard.test.ts
├── utils/                       # Utility functions
│   ├── haptics.ts               # Haptic feedback helpers
│   ├── dates.ts                 # Date formatting & comparison helpers
│   ├── mealDates.ts             # Weekday date helpers (Mon-Fri)
│   ├── mealImage.ts             # Meal photo pick/save/delete
│   ├── foodSearch.ts            # USDA food search, caching & macro estimation
│   └── __tests__/
│       └── foodSearch.test.ts   # estimateMacros unit tests
└── assets/                      # Static assets
    ├── fonts/                   # Custom fonts (DM Sans)
    └── sounds/                  # Timer completion sounds
```

## Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React Native | 0.81.5 |
| Platform | Expo | 54.0.31 |
| Navigation | Expo Router | 6.0.22 |
| Database | expo-sqlite | 16.0.10 |
| ORM | Drizzle ORM | 0.45.1 |
| Animations | react-native-reanimated | 4.1.1 |
| Gestures | react-native-gesture-handler | 2.28.0 |
| Audio | expo-av | 16.0.8 |
| Haptics | expo-haptics | 15.0.8 |
| Testing | Jest (jest-expo) | 54.0.16 |
| Test Utils | @testing-library/react-native | 13.3.3 |

## Data Flow

### Workout Session Flow
```
User selects template
        │
        ▼
ActiveWorkoutContext initializes session
        │
        ▼
workoutSessions row created (startedAt)
        │
        ▼
User logs sets → setLogs rows created
        │
        ▼
Rest timer triggers after set completion
        │
        ▼
User completes workout
        │
        ▼
Session updated (completedAt, durationSeconds)
```

### Progressive Overload Flow
```
useProgressiveOverload(exerciseId)
        │
        ▼
Query setLogs for exercise across sessions
        │
        ▼
Calculate volume trends (weight × reps)
        │
        ▼
Detect stalls (no progress in 3+ sessions)
        │
        ▼
Return suggestions (increase weight/reps)
```

## Navigation Structure

```
Stack Navigator (Root)
├── Tab Navigator
│   ├── Workout Tab (index)    → workout.tsx
│   ├── History Tab            → history.tsx
│   ├── Nutrition Tab          → nutrition.tsx
│   └── Insights Tab           → insights.tsx
└── Modal Screens
    ├── workout/[id]           → Active workout
    ├── workout/empty          → Empty workout
    ├── workout/create-split   → Split wizard
    ├── workout/edit-template  → Edit template exercises
    ├── settings               → Settings
    └── feedback               → Feedback form
```

### Template Exercise Editing Flow
```
User taps edit icon on TemplateCard (workout.tsx)
        |
        v
router.push('/workout/edit-template?templateId=xxx')
        |
        v
EditTemplateScreen loads:
  1. useTemplateExercises(templateId) -> fetch current exercises
  2. db.select(workoutTemplates) -> fetch template name
        |
        v
Local state: editedExercises[] (copy of loaded data)
  |- Add exercise -> ExercisePickerModal -> append to array
  |- Remove exercise -> filter from array
  |- Reorder -> swap indices in array
        |
        v
User taps "Save"
        |
        v
replaceTemplateExercises(templateId, editedExercises)
  -> Transaction: DELETE all + INSERT all with new orderIndex
        |
        v
router.back() -> Dashboard refetches via useFocusEffect
```

### Food Search Flow
```
User taps "Search Food" in MealForm
        │
        ▼
FoodSearchModal opens → useFoodSearch() hook
        │
        ▼
Debounced query (400ms) → searchFoods()
        │
        ▼
Check foodSearchCache (SQLite)
        │
   ┌────┴────┐
   │ HIT     │ MISS / STALE
   │ (fresh) │
   ▼         ▼
Return    Fetch from USDA API
cached    → Parse nutrients (per 100g)
items     → Cache in foodCache + foodSearchCache
              │
              ▼
User selects food → WeightInputPanel
        │
        ▼
Enter weight (grams) → estimateMacros()
        │
        ▼
"Use" → fills MealForm fields (name, calories, protein, carbs, fat)
```

## External Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| Vercel Functions | Feedback API | POST /api/feedback |
| GitHub Issues | Bug tracking | Created via Vercel API |
| USDA FoodData Central | Food nutrient lookup | GET /fdc/v1/foods/search (free API key) |

## Testing

The project uses **Jest** with the `jest-expo` preset and **React Native Testing Library** for component testing.

### Test Configuration
- Config: `jest.config.js` (jest-expo preset, `@/` path alias support)
- Setup: `jest.setup.js`
- Test location: `hooks/__tests__/`, `utils/__tests__/`
- Run: `npm test` or `npm run test:coverage`

### Test Coverage

| Test File | Module Under Test | What It Tests |
|-----------|------------------|---------------|
| `convertWeight.test.ts` | Weight conversion utility | kg/lbs conversion logic |
| `determineStatus.test.ts` | Set status determination | Workout set status logic |
| `useWorkoutDashboard.test.ts` | Dashboard helpers | Dashboard data computation |
| `foodSearch.test.ts` | `estimateMacros()` | Weight-based macro scaling and rounding |

#### Nutrition Test Suite (113 tests across 15 suites)

The meal tracking feature has comprehensive test coverage spanning utilities, hooks, and all UI components under `components/nutrition/__tests__/` and `hooks/__tests__/`.

## Related Documentation

- [Frontend Architecture](./frontend.md)
- [Database Architecture](./database.md)
- [Backend Architecture](./backend.md)
