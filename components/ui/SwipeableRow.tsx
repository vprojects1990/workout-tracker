import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/components/Themed';
import { Spacing, Radius } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

const SWIPE_THRESHOLD = 80;
const DELETE_THRESHOLD = 150;

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const colors = useColors();
  const translateX = useSharedValue(0);
  const rowHeight = useSharedValue<number | undefined>(undefined);
  const isDeleting = useSharedValue(false);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const triggerDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDelete();
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      // Only allow swiping left (negative values)
      if (event.translationX < 0) {
        translateX.value = event.translationX;

        // Trigger haptic when crossing threshold
        if (event.translationX < -SWIPE_THRESHOLD && !isDeleting.value) {
          isDeleting.value = true;
          runOnJS(triggerHaptic)();
        } else if (event.translationX > -SWIPE_THRESHOLD && isDeleting.value) {
          isDeleting.value = false;
        }
      }
    })
    .onEnd((event) => {
      if (event.translationX < -DELETE_THRESHOLD) {
        // Delete the item
        translateX.value = withTiming(-500, { duration: 200 });
        runOnJS(triggerDelete)();
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        isDeleting.value = false;
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteActionStyle = useAnimatedStyle(() => {
    const width = Math.abs(Math.min(translateX.value, 0));
    return {
      width,
      opacity: width > 20 ? 1 : 0,
    };
  });

  const deleteIconStyle = useAnimatedStyle(() => {
    const scale = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    return {
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Delete action background */}
      <Animated.View
        style={[
          styles.deleteAction,
          { backgroundColor: colors.error },
          deleteActionStyle,
        ]}
      >
        <Animated.View style={[styles.deleteIconContainer, deleteIconStyle]}>
          <Ionicons name="trash" size={24} color="#FFFFFF" />
          <Text style={styles.deleteText}>Delete</Text>
        </Animated.View>
      </Animated.View>

      {/* Swipeable content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.rowContent, rowStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: Radius.large,
    marginBottom: Spacing.md,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: Spacing.xl,
    borderRadius: Radius.large,
  },
  deleteIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    ...Typography.caption1,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  rowContent: {
    backgroundColor: 'transparent',
  },
});

export default SwipeableRow;
