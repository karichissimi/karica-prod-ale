import { useCallback } from "react";

type HapticType = "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";

// Vibration patterns in milliseconds
const hapticPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  selection: 5,
  success: [10, 50, 20],
  warning: [20, 100, 20],
  error: [30, 100, 30, 100, 30],
};

export function useHapticFeedback() {
  const vibrate = useCallback((type: HapticType = "light") => {
    // Check if vibration API is supported
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      const pattern = hapticPatterns[type];
      navigator.vibrate(pattern);
    }
  }, []);

  const lightTap = useCallback(() => vibrate("light"), [vibrate]);
  const mediumTap = useCallback(() => vibrate("medium"), [vibrate]);
  const heavyTap = useCallback(() => vibrate("heavy"), [vibrate]);
  const selectionTap = useCallback(() => vibrate("selection"), [vibrate]);
  const successFeedback = useCallback(() => vibrate("success"), [vibrate]);
  const warningFeedback = useCallback(() => vibrate("warning"), [vibrate]);
  const errorFeedback = useCallback(() => vibrate("error"), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    selectionTap,
    successFeedback,
    warningFeedback,
    errorFeedback,
  };
}

// Standalone function for use outside React components
export function triggerHaptic(type: HapticType = "light") {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const pattern = hapticPatterns[type];
    navigator.vibrate(pattern);
  }
}
