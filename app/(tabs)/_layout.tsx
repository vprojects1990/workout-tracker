import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ErrorBoundary>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
        }}
        initialRouteName="workout">
        <Tabs.Screen
          name="workout"
          options={{
            title: 'Workout',
            tabBarIcon: ({ color }) => <TabBarIcon name="heartbeat" color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: 'Nutrition',
            tabBarIcon: ({ color }) => <TabBarIcon name="cutlery" color={color} />,
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: 'Insights',
            tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />,
          }}
        />
      </Tabs>
    </ErrorBoundary>
  );
}
