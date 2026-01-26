# Workout Tracker - Architecture Overview

> Version 0.7.0 | Last updated: 2026-01-26

## Project Overview

Workout Tracker is a React Native workout tracking application built with Expo. It provides workout template management, live session tracking, progressive overload monitoring, and workout history analysis.

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
└─────────────────────────────────────────────────────────────┘
                           │
                    Feedback API
                           │
                           ▼
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
│   │   └── insights.tsx         # Progress & analytics
│   ├── workout/                 # Workout-related modals
│   │   ├── [id].tsx             # Active workout session
│   │   ├── empty.tsx            # Empty workout (no template)
│   │   └── create-split.tsx     # Create split wizard
│   ├── settings.tsx             # App settings
│   └── feedback.tsx             # Bug report / feedback form
├── components/                   # Reusable components
│   ├── ui/                      # Base UI primitives
│   ├── dashboard/               # Dashboard widgets
│   ├── workout/                 # Workout session components
│   ├── history/                 # History list components
│   ├── insights/                # Analytics components
│   ├── animations/              # Animation components
│   └── wizard/                  # Multi-step form components
├── constants/                    # Design tokens
│   ├── Colors.ts                # Color palette (light/dark)
│   ├── Typography.ts            # Font styles
│   ├── Spacing.ts               # Spacing scale
│   └── Shadows.ts               # Shadow definitions
├── contexts/                     # React contexts
│   ├── DatabaseContext.tsx      # Database initialization
│   └── ThemeContext.tsx         # Theme management
├── db/                          # Database layer
│   ├── index.ts                 # Database instance
│   ├── schema.ts                # Drizzle schema definitions
│   ├── migrations.ts            # Schema migrations
│   └── seed.ts                  # Seed data (170+ exercises)
├── hooks/                       # Custom React hooks
│   ├── useWorkoutTemplates.ts   # Template & split management
│   ├── useActiveWorkout.ts      # Live workout session
│   ├── useWorkoutHistory.ts     # Past sessions
│   ├── useWorkoutDashboard.ts   # Dashboard data
│   ├── useProgressiveOverload.ts # Progress tracking
│   └── useSettings.ts           # User preferences
├── utils/                       # Utility functions
│   └── haptics.ts               # Haptic feedback helpers
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

## Data Flow

### Workout Session Flow
```
User selects template
        │
        ▼
useActiveWorkout() initializes session
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
│   └── Insights Tab           → insights.tsx
└── Modal Screens
    ├── workout/[id]           → Active workout
    ├── workout/empty          → Empty workout
    ├── workout/create-split   → Split wizard
    ├── settings               → Settings
    └── feedback               → Feedback form
```

## External Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| Vercel Functions | Feedback API | POST /api/feedback |
| GitHub Issues | Bug tracking | Created via Vercel API |

## Related Documentation

- [Frontend Architecture](./frontend.md)
- [Database Architecture](./database.md)
- [Backend Architecture](./backend.md)
