import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components.
 * Displays a user-friendly fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
  title?: string;
  message?: string;
}

/**
 * Default fallback UI shown when an error occurs.
 * Uses a function component to access hooks for theming.
 */
function ErrorFallback({
  error,
  onRetry,
  title = 'Something went wrong',
  message = "We're sorry, but something unexpected happened. Please try again.",
}: ErrorFallbackProps): React.ReactElement {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { backgroundColor: colors.card }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.error + '15' }]}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>

        {__DEV__ && error && (
          <View style={[styles.errorDetails, { backgroundColor: colors.fillTertiary }]}>
            <Text style={[styles.errorLabel, { color: colors.textTertiary }]}>
              Error Details (Dev Only):
            </Text>
            <Text style={[styles.errorText, { color: colors.error }]} numberOfLines={3}>
              {error.message}
            </Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: colors.accent },
            pressed && styles.retryButtonPressed,
          ]}
          onPress={onRetry}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    padding: Spacing.xxl,
    borderRadius: Radius.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  errorDetails: {
    width: '100%',
    padding: Spacing.md,
    borderRadius: Radius.medium,
    marginBottom: Spacing.xl,
  },
  errorLabel: {
    ...Typography.caption1,
    marginBottom: Spacing.xs,
  },
  errorText: {
    ...Typography.caption1,
    fontFamily: 'SpaceMono',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.medium,
    gap: Spacing.sm,
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ErrorBoundary;
