import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Card } from '@/components/ui';
import { Typography, TextStyles } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  FadeInDown,
  interpolate,
} from 'react-native-reanimated';

interface StatItem {
  value: number;
  label: string;
  status: 'success' | 'warning' | 'error';
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SummaryStatsProps {
  stats: StatItem[];
}

function AnimatedStatCard({
  stat,
  index,
}: {
  stat: StatItem;
  index: number;
}) {
  const colors = useColors();
  const countValue = useSharedValue(0);
  const scale = useSharedValue(0.8);

  const statusColors = {
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  };

  const statusColor = statusColors[stat.status];

  useEffect(() => {
    // Animate scale
    scale.value = withDelay(
      index * 100,
      withSpring(1, { damping: 12, stiffness: 100 })
    );

    // Animate count
    countValue.value = withDelay(
      index * 100 + 200,
      withTiming(stat.value, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [stat.value, index]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.8, 1], [0, 1]),
  }));

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    if (stat.icon) return stat.icon;
    switch (stat.status) {
      case 'success':
        return 'trending-up';
      case 'warning':
        return 'remove';
      case 'error':
        return 'trending-down';
    }
  };

  return (
    <Animated.View style={[styles.statCard, containerStyle]}>
      <Card
        variant="filled"
        style={[styles.cardInner, { borderLeftColor: statusColor }]}
        padding="md"
      >
        {/* Background gradient effect */}
        <View
          style={[
            styles.gradientOverlay,
            { backgroundColor: statusColor + '08' },
          ]}
        />

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: statusColor + '15' }]}>
          <Ionicons name={getStatusIcon()} size={16} color={statusColor} />
        </View>

        {/* Value */}
        <Text style={[styles.statValue, { color: colors.text }]}>
          {stat.value}
        </Text>

        {/* Label */}
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
          {stat.label}
        </Text>
      </Card>
    </Animated.View>
  );
}

export function SummaryStats({ stats }: SummaryStatsProps) {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <AnimatedStatCard key={stat.label} stat={stat} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
  },
  cardInner: {
    borderLeftWidth: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...TextStyles.statValue,
    fontSize: 24,
  },
  statLabel: {
    ...Typography.caption1,
    marginTop: 2,
  },
});

export default SummaryStats;
