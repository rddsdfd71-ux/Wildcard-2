import { useState, useEffect, useRef, useCallback } from "react";

export type PermissionState = "unknown" | "granted" | "denied" | "unsupported";

interface StepCounterState {
  steps: number;
  isRunning: boolean;
  permission: PermissionState;
  isSupported: boolean;
}

/**
 * Real-time step counter using the device accelerometer (DeviceMotionEvent).
 * Works in mobile browsers on iOS 13+ (after permission) and Android.
 * Algorithm: peak detection on the smoothed acceleration magnitude.
 */
export function useLiveStepCounter() {
  const [state, setState] = useState<StepCounterState>({
    steps: 0,
    isRunning: false,
    permission: "unknown",
    isSupported: false,
  });

  // Internal refs so event handlers always see latest values
  const stepsRef = useRef(0);
  const lastPeakTimeRef = useRef(0);
  const smoothedRef = useRef(0);
  const lastSmoothedRef = useRef(0);
  const aboveThresholdRef = useRef(false);
  const listenerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);

  // Check if DeviceMotionEvent is available at all
  useEffect(() => {
    const supported = typeof DeviceMotionEvent !== "undefined";
    setState((s) => ({ ...s, isSupported: supported }));
    if (!supported) {
      setState((s) => ({ ...s, permission: "unsupported" }));
    }
  }, []);

  const processMotion = useCallback((e: DeviceMotionEvent) => {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;

    const x = acc.x ?? 0;
    const y = acc.y ?? 0;
    const z = acc.z ?? 0;
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    // Exponential moving average (low-pass filter) — alpha controls smoothing
    const alpha = 0.15;
    smoothedRef.current = alpha * magnitude + (1 - alpha) * smoothedRef.current;

    const now = Date.now();
    const MIN_STEP_INTERVAL_MS = 300; // debounce: max ~3 steps/sec
    const STEP_THRESHOLD = 11.5; // tuned for walking on phone (9.8 = gravity)

    // Rising edge detection: smoothed crosses above threshold
    if (
      smoothedRef.current > STEP_THRESHOLD &&
      lastSmoothedRef.current <= STEP_THRESHOLD &&
      !aboveThresholdRef.current &&
      now - lastPeakTimeRef.current > MIN_STEP_INTERVAL_MS
    ) {
      aboveThresholdRef.current = true;
      lastPeakTimeRef.current = now;
      stepsRef.current += 1;
      setState((s) => ({ ...s, steps: stepsRef.current }));
    }

    // Falling edge
    if (smoothedRef.current < STEP_THRESHOLD && aboveThresholdRef.current) {
      aboveThresholdRef.current = false;
    }

    lastSmoothedRef.current = smoothedRef.current;
  }, []);

  const startCounting = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    // iOS 13+ requires explicit permission via a user gesture
    if (
      typeof (DeviceMotionEvent as any).requestPermission === "function"
    ) {
      try {
        const result = await (DeviceMotionEvent as any).requestPermission();
        if (result !== "granted") {
          setState((s) => ({ ...s, permission: "denied" }));
          return false;
        }
        setState((s) => ({ ...s, permission: "granted" }));
      } catch {
        setState((s) => ({ ...s, permission: "denied" }));
        return false;
      }
    } else {
      // Android / non-iOS — permission not required
      setState((s) => ({ ...s, permission: "granted" }));
    }

    // Attach the event listener
    stepsRef.current = 0;
    smoothedRef.current = 0;
    lastSmoothedRef.current = 0;
    aboveThresholdRef.current = false;
    lastPeakTimeRef.current = 0;

    listenerRef.current = processMotion;
    window.addEventListener("devicemotion", processMotion, { passive: true });

    setState((s) => ({ ...s, isRunning: true, steps: 0 }));
    return true;
  }, [state.isSupported, processMotion]);

  const stopCounting = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener("devicemotion", listenerRef.current);
      listenerRef.current = null;
    }
    setState((s) => ({ ...s, isRunning: false }));
    return stepsRef.current;
  }, []);

  const resetSteps = useCallback(() => {
    stepsRef.current = 0;
    setState((s) => ({ ...s, steps: 0 }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        window.removeEventListener("devicemotion", listenerRef.current);
      }
    };
  }, []);

  return {
    steps: state.steps,
    isRunning: state.isRunning,
    permission: state.permission,
    isSupported: state.isSupported,
    startCounting,
    stopCounting,
    resetSteps,
  };
}
