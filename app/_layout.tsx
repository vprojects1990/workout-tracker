import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/components/useColorScheme';
import { DatabaseProvider, useDatabase } from '@/contexts/DatabaseContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ActiveWorkoutProvider } from '@/contexts/ActiveWorkoutContext';
import { View, Text } from '@/components/Themed';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Re-export our custom ErrorBoundary for expo-router to use
export { ErrorBoundary } from '@/components/ErrorBoundary';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // DM Sans font family - for display and body text
    'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
    'DMSans-SemiBold': require('../assets/fonts/DMSans-SemiBold.ttf'),
    'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf'),
    // SpaceMono - for monospace numbers
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // FontAwesome - for icons
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DatabaseProvider>
        <DatabaseReadyGate />
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}

// This component waits for the database to be ready before rendering ThemeProvider
function DatabaseReadyGate() {
  const { isReady, error } = useDatabase();

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Database error: {error.message}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Database is ready, now we can use ThemeProvider and ActiveWorkoutProvider
  return (
    <ThemeProvider>
      <ActiveWorkoutProvider>
        <ErrorBoundary>
          <RootLayoutNav />
        </ErrorBoundary>
      </ActiveWorkoutProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="workout/[id]"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="workout/empty"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="workout/create-split"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="feedback"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}
