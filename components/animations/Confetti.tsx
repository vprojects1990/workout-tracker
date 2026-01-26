import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  color: string;
  rotation: number;
  size: number;
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
  colors?: string[];
  pieceCount?: number;
  duration?: number;
}

const DEFAULT_COLORS = ['#E94560', '#06D6A0', '#FFD60A', '#5E5CE6', '#FF9F0A'];

function ConfettiPieceComponent({ piece, duration }: { piece: ConfettiPiece; duration: number }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Initial pop
    scale.value = withDelay(
      piece.delay,
      withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 100 })
      )
    );

    // Fall animation
    translateY.value = withDelay(
      piece.delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration: duration,
        easing: Easing.in(Easing.quad),
      })
    );

    // Horizontal drift
    const drift = (Math.random() - 0.5) * 100;
    translateX.value = withDelay(
      piece.delay,
      withTiming(drift, {
        duration: duration,
        easing: Easing.inOut(Easing.sin),
      })
    );

    // Rotation
    rotate.value = withDelay(
      piece.delay,
      withTiming(piece.rotation + 360 * (Math.random() > 0.5 ? 1 : -1), {
        duration: duration,
        easing: Easing.linear,
      })
    );

    // Fade out at end
    opacity.value = withDelay(
      piece.delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: piece.x,
          width: piece.size,
          height: piece.size,
          backgroundColor: piece.color,
          borderRadius: piece.size > 8 ? 2 : piece.size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function Confetti({
  active,
  onComplete,
  colors = DEFAULT_COLORS,
  pieceCount = 50,
  duration = 2000,
}: ConfettiProps) {
  const pieces = useMemo(() => {
    if (!active) return [];

    return Array.from({ length: pieceCount }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      delay: Math.random() * 300,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      size: 6 + Math.random() * 8,
    }));
  }, [active, pieceCount, colors]);

  useEffect(() => {
    if (active && onComplete) {
      const timeout = setTimeout(() => {
        onComplete();
      }, duration + 500);
      return () => clearTimeout(timeout);
    }
  }, [active, duration, onComplete]);

  if (!active || pieces.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPieceComponent key={piece.id} piece={piece} duration={duration} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  piece: {
    position: 'absolute',
    top: 0,
  },
});

export default Confetti;
