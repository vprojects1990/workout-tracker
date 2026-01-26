import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useColors } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { Spacing, Radius } from '@/constants/Spacing';
import Animated, { FadeIn } from 'react-native-reanimated';

interface DataPoint {
  value: number;
  date?: Date;
}

interface ProgressSparklineProps {
  data: DataPoint[];
  height?: number;
  width?: number;
  showTrend?: boolean;
  unit?: string;
}

export function ProgressSparkline({
  data,
  height = 32,
  width = 100,
  showTrend = true,
  unit = '',
}: ProgressSparklineProps) {
  const colors = useColors();

  if (data.length < 2) {
    return null;
  }

  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Calculate trend
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const trend = secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'flat';

  const trendColor = trend === 'up' ? colors.success : trend === 'down' ? colors.error : colors.textTertiary;

  // Calculate change
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const change = lastValue - firstValue;
  const changePercent = firstValue > 0 ? ((change / firstValue) * 100).toFixed(0) : '0';

  // Generate path points
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return { x, y };
  });

  // Create area under the line
  const areaPoints = [...points, { x: width, y: height }, { x: 0, y: height }];

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      {/* Sparkline */}
      <View style={[styles.chartContainer, { height, width }]}>
        {/* Area fill */}
        <View style={[styles.areaFill, { backgroundColor: trendColor + '10' }]} />

        {/* Line segments */}
        {points.slice(0, -1).map((point, index) => {
          const nextPoint = points[index + 1];
          const dx = nextPoint.x - point.x;
          const dy = nextPoint.y - point.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          return (
            <View
              key={index}
              style={[
                styles.lineSegment,
                {
                  width: length,
                  backgroundColor: trendColor,
                  left: point.x,
                  top: point.y,
                  transform: [{ rotate: `${angle}deg` }],
                },
              ]}
            />
          );
        })}

        {/* End dot */}
        <View
          style={[
            styles.endDot,
            {
              backgroundColor: trendColor,
              left: points[points.length - 1].x - 3,
              top: points[points.length - 1].y - 3,
            },
          ]}
        />
      </View>

      {/* Trend indicator */}
      {showTrend && (
        <View style={styles.trendContainer}>
          <Text style={[styles.changeText, { color: trendColor }]}>
            {change >= 0 ? '+' : ''}{change}{unit ? ` ${unit}` : ''}
          </Text>
          <Text style={[styles.percentText, { color: colors.textTertiary }]}>
            ({change >= 0 ? '+' : ''}{changePercent}%)
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chartContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  areaFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderRadius: Radius.small,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    transformOrigin: 'left center',
  },
  endDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  changeText: {
    ...Typography.caption1,
    fontWeight: '600',
  },
  percentText: {
    ...Typography.caption2,
  },
});

export default ProgressSparkline;
