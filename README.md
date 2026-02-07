# Workout Tracker

A modern, feature-rich workout tracking app built with React Native and Expo. Track your workouts, monitor progress, and achieve your fitness goals with an intuitive and beautiful interface.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61dafb.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.31-000020.svg)](https://expo.dev/)

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Features

### Workout Management
- **Workout Splits** - Organize workouts into splits (e.g., "4-Day Upper/Lower", "Push/Pull/Legs")
- **Workout Templates** - Create and manage custom workout routines with day-of-week scheduling
- **Edit Template Exercises** - Add, remove, and reorder exercises in existing templates with a dedicated editing screen
- **Live Workout Tracking** - Real-time session timer with set logging
- **Rest Timer** - Configurable rest periods with sound notifications

### Exercise Library
- **170+ Exercises** - Built-in database organized by muscle group and equipment

### Progress Tracking
- **Workout History** - View past sessions with duration and stats
- **Progress Insights** - Track your fitness journey over time

### Nutrition
- **Meal Tracking** - Log meals with calories, protein, carbs, fat, and photos
- **USDA Food Search** - Search the USDA FoodData Central database and auto-fill macros by weight
- **Weekly Overview** - Mon-Sun adherence view against daily macro targets

### Customization
- **Dark Mode** - Automatic theme based on system preference
- **Settings** - Weight units (kg/lbs), rest duration, and more
- **Feedback System** - Built-in bug reporting and feature suggestions (Settings → Send Feedback)

## Screenshots

<!-- Add screenshots here -->
<!-- ![Home Screen](screenshots/home.png) -->
<!-- ![Active Workout](screenshots/workout.png) -->

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | [React Native](https://reactnative.dev/) | 0.81.5 |
| Platform | [Expo](https://expo.dev/) | 54.0.31 |
| Navigation | [Expo Router](https://docs.expo.dev/router/introduction/) | 6.0.22 |
| Database | [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) + [Drizzle ORM](https://orm.drizzle.team/) | 16.0.10 / 0.45.1 |
| Animations | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | 4.1.1 |
| Gestures | [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) | 2.28.0 |
| Audio | [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/) | 16.0.8 |
| Haptics | [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) | 15.0.8 |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) app on your device (for development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vprojects1990/workout-tracker.git
   cd workout-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   # Optional: USDA food search (free key from https://fdc.nal.usda.gov/api-key-signup.html)
   export USDA_API_KEY=your_key_here
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Scan the QR code with Expo Go (Android) or Camera app (iOS)

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Project Structure

```
workout-tracker/
├── app/                    # App screens (Expo Router)
│   ├── (tabs)/            # Tab navigation screens (workout, history, insights)
│   ├── workout/           # Workout modals ([id], empty, create-split, edit-template)
│   ├── settings.tsx       # Settings screen
│   └── feedback.tsx       # Bug report / feature request
├── components/            # Reusable components
│   ├── ui/               # Base UI components (Button, Card, Input, etc.)
│   ├── dashboard/        # Dashboard widgets (WeekCalendar, StreakDisplay, etc.)
│   ├── workout/          # Workout session components
│   ├── history/          # History list components
│   ├── insights/         # Analytics components
│   ├── animations/       # Animation components (Confetti, PRCelebration)
│   └── wizard/           # Multi-step form components
├── constants/            # Design tokens (Colors, Typography, Spacing, Shadows)
├── contexts/             # React contexts (Database, Theme)
├── db/                   # Database layer (schema, migrations, seed)
├── hooks/                # Custom React hooks (9 data management hooks)
├── utils/                # Utility functions (haptics)
└── assets/               # Fonts (DM Sans) and sounds
```

For detailed architecture documentation, see [docs/CODEMAPS/](docs/CODEMAPS/INDEX.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Follow existing code style and patterns
4. Test your changes thoroughly
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing component patterns in `components/`
- Use the design tokens from `constants/` (Colors, Typography, Spacing)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Exercise data inspired by common gym routines
- Timer sound from [Mixkit](https://mixkit.co/)
- Typography: [DM Sans](https://fonts.google.com/specimen/DM+Sans) by Colophon Foundry
- Icons: [@expo/vector-icons](https://icons.expo.fyi/)
