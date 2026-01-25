# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-01-25

### Added
- **Feedback Submission**: Report bugs and suggest features directly from the app
  - Access via Settings → Send Feedback
  - Choose feedback type: Bug, Feature Request, or Other
  - Add subject, description, and optional contact email
  - Attach screenshots from your device
  - Submissions create GitHub Issues automatically for tracking
- **Vercel API Integration**: Serverless backend for processing feedback submissions

## [0.5.0] - 2026-01-24

### Added
- **Workout Templates**: Create and manage custom workout templates with exercises
- **Exercise Library**: Built-in exercise database organized by muscle group and equipment
- **Active Workout Tracking**: Real-time workout session with duration timer
- **Set Logging**: Track reps and weight for each set with completion marking
- **Rest Timer**: Automatic rest timer after completing sets
  - Full-screen overlay with countdown display
  - Mini floating badge when overlay is dismissed (timer continues in background)
  - Completion sound and haptic feedback when timer ends
- **Workout History**: View past workout sessions with duration and stats
- **Settings**: Configurable weight units (kg/lbs) and default rest time
- **Empty Workout Mode**: Start a workout without a template
- **Dark Mode Support**: Automatic theme based on system preference

### Fixed
- Duration timer now stops when workout is completed
