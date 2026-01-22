# Gym Track MVP Design

## Overview

A gym tracking application focused on progressive overload methodology based on mechanical tension principles. Differentiates from competitors (Strong, Hevy, JEFIT) through intelligent progress tracking and stall detection.

**Target:** Personal use initially, potential to open up for others later.

## Tech Stack

- **Framework:** Expo / React Native (iOS + Android)
- **Database:** expo-sqlite with Drizzle ORM (local-first, sync-ready)
- **State:** React Context with local DB as source of truth
- **UI:** React Native core components + themed components (light/dark mode)

## Data Model

```
Exercise
├── id (uuid)
├── name ("Bench Press")
├── primaryMuscle (chest | back | shoulders | biceps | triceps | quads | hamstrings | glutes | core)
├── secondaryMuscles (array)
├── equipment (barbell | dumbbell | cable | machine | bodyweight)
├── isCustom (boolean)

WorkoutTemplate
├── id (uuid)
├── name ("Upper A")
├── type (upper | lower | custom)
├── exercises: [
│     {
│       exerciseId (uuid)
│       targetRepMin (e.g., 8)
│       targetRepMax (e.g., 12)
│       targetSets (e.g., 3)
│       order (integer)
│     }
│   ]

WorkoutSession
├── id (uuid)
├── templateId (references template)
├── startedAt (timestamp)
├── completedAt (timestamp)
├── durationSeconds (integer)

SetLog
├── id (uuid)
├── sessionId (references session)
├── exerciseId (references exercise)
├── setNumber (1, 2, 3...)
├── reps (integer)
├── weight (decimal)
├── restSeconds (integer)

UserSettings
├── id (uuid)
├── weightUnit (kg | lbs)
├── defaultRestSeconds (integer, default 90)
├── theme (light | dark | system)
```

## Navigation Structure

Three tabs:

```
┌─────────────┬─────────────┬─────────────┐
│   Workout   │   History   │   Insights  │
└─────────────┴─────────────┴─────────────┘
```

## Screens

### 1. Workout Tab (Home)

- Displays Upper/Lower split with template cards
- Shows "last performed" date on each template
- Tap template to start workout session
- Button to create custom workout

### 2. Active Workout Screen (Modal)

```
┌─────────────────────────────────────┐
│  Upper A              ⏱️ 32:15     │  ← Workout timer
├─────────────────────────────────────┤
│  Bench Press          Barbell       │  ← Equipment shown
│  Last: 80kg                         │  ← Minimal previous reference
│  ┌─────┬─────┬───────┐              │
│  │ Set │ kg  │ Reps  │              │
│  ├─────┼─────┼───────┤              │
│  │ 1   │ 80  │ 8     │ ✓           │
│  │ 2   │ 80  │ 8     │ ✓           │
│  │ 3   │     │       │ ← current   │
│  └─────┴─────┴───────┘              │
│                                     │
│  Rest Timer: 1:23 remaining         │
├─────────────────────────────────────┤
│  Incline Dumbbell Press   Dumbbell  │
│  Last: 24kg                         │
└─────────────────────────────────────┘
```

Features:
- Workout timer (auto-starts on session begin)
- Equipment type displayed per exercise
- "Last: Xkg" minimal reference to previous session
- Rest timer (auto-starts after logging a set)
- Set logging: weight + reps per set

### 3. History Tab

- List/calendar view of past workouts
- Filter by template type (Upper/Lower/All)
- Tap session to view full details

### 4. Insights Tab

**Progressive Overload Tracker (Double Progression Method)**

```
┌─────────────────────────────────────┐
│  Bench Press            8-12 reps  │  ← Target range from template
├─────────────────────────────────────┤
│  Current: 80kg                      │
│  Last session: 12, 11, 10 reps      │
│  ✅ Ready to increase weight        │
├─────────────────────────────────────┤
│  Lat Pulldown           8-12 reps  │
├─────────────────────────────────────┤
│  Current: 60kg                      │
│  Last 3 sessions: 8,8,7 → 8,8,8 → 8,8,8
│  ⚠️ Stalled - consider deload/variation
└─────────────────────────────────────┘
```

**Progress Trends Chart**
- Select exercise from dropdown
- Line chart showing weight progression over time

**Stall Detection**
- Flags exercises with no rep/weight increase for 3+ sessions
- Suggests action (deload, variation, etc.)

### 5. Additional Screens

- **Exercise Library:** Browse/search exercises, add custom
- **Edit Template:** Modify exercises, rep ranges, set counts
- **Settings:** kg/lbs toggle, default rest timer, theme

## Exercise Library

Curated library of 50-80 common exercises with:
- Name
- Primary muscle group
- Secondary muscle group(s)
- Equipment type (barbell, dumbbell, cable, machine, bodyweight)

Users can add custom exercises.

### Muscle Groups
- Chest
- Back
- Shoulders
- Biceps
- Triceps
- Quads
- Hamstrings
- Glutes
- Core

### Equipment Types
- Barbell
- Dumbbell
- Cable
- Machine
- Bodyweight

## Progressive Overload Methodology

Based on **double progression** (science-based, mechanical tension):

1. Set a target rep range per exercise (e.g., 8-12)
2. When all sets hit top of range → increase weight
3. With new weight, reps drop → work back up
4. Repeat cycle

**App logic:**
- Track if user hit top of rep range for all sets
- Display "Ready to increase weight" prompt
- Flag stalls when stuck at bottom of range for 3+ sessions

## MVP Scope

### Included
- Upper/Lower workout templates
- Custom workout creation
- Exercise library (50-80 exercises) + custom exercises
- Set logging (reps, weight, rest time)
- Workout timer
- Rest timer between sets
- Progressive overload tracker (double progression)
- Progress charts per exercise
- Stall detection
- kg/lbs unit preference
- Light/dark theme
- Local SQLite storage (sync-ready schema)
- iOS + Android support

### Not Included (Future)
- Cloud sync
- Social features
- Additional split types (PPL, Bro split, etc.)
- Body measurements/photos
- RPE tracking
- AI-powered recommendations
- Export/backup

## Research Sources

Competitive analysis of:
- [Strong](https://www.strong.app/) - Minimal UI, fast logging, data export
- [Hevy](https://www.hevyapp.com/) - Social features, templates, free tier
- [JEFIT](https://www.jefit.com/) - Large exercise database, gamification
