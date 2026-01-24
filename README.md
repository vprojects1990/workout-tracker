# Workout Tracker

A modern, feature-rich workout tracking app built with React Native and Expo. Track your workouts, monitor progress, and achieve your fitness goals.

## Features

- **Workout Templates** - Create and manage custom workout routines
- **Exercise Library** - Built-in database of exercises organized by muscle group and equipment
- **Live Workout Tracking** - Real-time session timer with set logging
- **Rest Timer** - Configurable rest periods with sound notifications
- **Workout History** - View past sessions with duration and stats
- **Progress Insights** - Track your fitness journey over time
- **Dark Mode** - Automatic theme based on system preference
- **Customizable Settings** - Weight units (kg/lbs), rest duration, and more

## Screenshots

<!-- Add screenshots here -->
<!-- ![Home Screen](screenshots/home.png) -->
<!-- ![Active Workout](screenshots/workout.png) -->

## Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Audio**: [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)
- **Haptics**: [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)

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

3. Start the development server:
   ```bash
   npm start
   ```

4. Scan the QR code with Expo Go (Android) or Camera app (iOS)

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
│   ├── (tabs)/            # Tab navigation screens
│   ├── workout/           # Workout-related screens
│   └── settings.tsx       # Settings screen
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── dashboard/        # Dashboard widgets
│   └── wizard/           # Multi-step form components
├── constants/            # Design tokens and constants
├── contexts/             # React contexts
├── db/                   # Database schema and seeds
├── hooks/                # Custom React hooks
└── assets/               # Images, fonts, and sounds
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Exercise data inspired by common gym routines
- Timer sound from [Mixkit](https://mixkit.co/)
