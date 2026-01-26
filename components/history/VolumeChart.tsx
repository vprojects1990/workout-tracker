import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/components/Themed';
import Animated, { FadeIn } from 'react-native-reanimated';

interface VolumeChartProps {
  data: number[];
  height?: number;
  width?: number;
  barColor?: string;
}

export function VolumeChart({
  data,
  height = 24,
  width = 60,
  barColor,
}: VolumeChartProps) {
  const colors = useColors();
  const color = barColor || colors.accent;

  if (data.length === 0) return null;

  const maxValue = Math.max(...data, 1);
  const barWidth = Math.max(4, (width - (data.length - 1) * 2) / data.length);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={[styles.container, { height, width }]}
    >
      {data.map((value, index) => {
        const barHeight = Math.max(2, (value / maxValue) * height);
        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: barHeight,
                width: barWidth,
                backgroundColor: color,
                opacity: 0.4 + (value / maxValue) * 0.6,
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    borderRadius: 2,
  },
});

export default VolumeChart;
