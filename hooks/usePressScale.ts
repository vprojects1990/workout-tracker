import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

interface PressScaleOptions {
  /** Scale when pressed. Default: 0.95 */
  pressedScale?: number;
  /** Whether to bounce back with overshoot. Default: true */
  bounce?: boolean;
  /** Overshoot scale on release. Default: 1.02 */
  overshootScale?: number;
  /** Spring config for press-in. */
  pressInConfig?: { damping?: number; stiffness?: number; mass?: number };
  /** Spring config for bounce. */
  bounceConfig?: { damping?: number; stiffness?: number; mass?: number };
  /** Spring config for settle. */
  settleConfig?: { damping?: number; stiffness?: number; mass?: number };
}

const DEFAULT_PRESS_IN = { damping: 15, stiffness: 400, mass: 0.8 };
const DEFAULT_BOUNCE = { damping: 8, stiffness: 350, mass: 0.6 };
const DEFAULT_SETTLE = { damping: 12, stiffness: 200, mass: 0.8 };

export function usePressScale(options: PressScaleOptions = {}) {
  const {
    pressedScale = 0.95,
    bounce = true,
    overshootScale = 1.02,
    pressInConfig = DEFAULT_PRESS_IN,
    bounceConfig = DEFAULT_BOUNCE,
    settleConfig = DEFAULT_SETTLE,
  } = options;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(pressedScale, pressInConfig);
  };

  const handlePressOut = () => {
    if (bounce) {
      scale.value = withSequence(
        withSpring(overshootScale, bounceConfig),
        withSpring(1, settleConfig)
      );
    } else {
      scale.value = withSpring(1, pressInConfig);
    }
  };

  return { animatedStyle, handlePressIn, handlePressOut };
}
