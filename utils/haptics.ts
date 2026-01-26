import * as Haptics from 'expo-haptics';

/**
 * Standardized haptic feedback patterns for the app
 */
export const haptics = {
  /**
   * Light tap - for button presses, selections
   */
  tap: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Medium tap - for toggle switches, completing actions
   */
  press: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Heavy tap - for significant actions, confirmations
   */
  impact: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Selection changed - for pickers, sliders
   */
  selection: () => {
    Haptics.selectionAsync();
  },

  /**
   * Success - for completed sets, achievements
   */
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Warning - for delete confirmations, alerts
   */
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /**
   * Error - for validation errors, failures
   */
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /**
   * Celebration - double success for PRs, milestones
   */
  celebration: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 100);
  },

  /**
   * Set complete - satisfying feedback for completing a set
   */
  setComplete: async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 50);
  },

  /**
   * Timer tick - for countdown timer last few seconds
   */
  timerTick: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  },

  /**
   * Timer complete - when rest timer finishes
   */
  timerComplete: async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 150);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 300);
  },

  /**
   * Swipe action - for swipe-to-delete, etc
   */
  swipe: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Expand/collapse - for accordion-style interactions
   */
  toggle: () => {
    Haptics.selectionAsync();
  },
};

export default haptics;
