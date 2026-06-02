/**
 * Unified health service for Wild Card.
 *
 * How Capacitor detection works (no package import needed):
 *   When the app runs inside the native iOS/Android shell, Capacitor
 *   automatically injects `window.Capacitor` into the WebView at startup.
 *   In a browser / PWA there is no window.Capacitor, so we fall back gracefully.
 *
 * Native platforms:
 *   iOS  → cordova-plugin-health wraps HealthKit  (navigator.health)
 *   Android → cordova-plugin-health wraps Google Fit (navigator.health)
 *
 * Browser:
 *   Falls back to DeviceMotionEvent accelerometer step counting.
 */

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
    };
  }
}

export type HealthPlatform = "healthkit" | "google_fit" | "web";

export interface TodayHealthData {
  steps: number;
  calories: number;
  distanceKm: number;
  avgHeartRate?: number;
  source: HealthPlatform;
}

const HEALTH_TYPES = ["steps", "calories", "distance", "heart_rate"];

function nh(): any {
  return (navigator as any).health;
}

/** True when running inside the native Capacitor iOS/Android shell */
export function isNativePlatform(): boolean {
  return window.Capacitor?.isNativePlatform() ?? false;
}

export function getNativePlatform(): "ios" | "android" | "web" {
  const p = window.Capacitor?.getPlatform() ?? "web";
  return p as "ios" | "android" | "web";
}

export function getHealthSource(): HealthPlatform {
  if (!isNativePlatform()) return "web";
  return getNativePlatform() === "ios" ? "healthkit" : "google_fit";
}

export async function isHealthAvailable(): Promise<boolean> {
  if (!isNativePlatform() || !nh()?.isAvailable) return false;
  return new Promise((resolve) =>
    nh().isAvailable(
      (ok: boolean) => resolve(ok),
      () => resolve(false)
    )
  );
}

export async function requestHealthPermissions(): Promise<boolean> {
  if (!nh()?.requestAuthorization) return false;
  return new Promise((resolve, reject) =>
    nh().requestAuthorization(
      HEALTH_TYPES,
      () => resolve(true),
      (err: any) => reject(new Error(String(err)))
    )
  );
}

export async function checkHealthPermissions(): Promise<boolean> {
  if (!nh()?.isAuthorized) return false;
  return new Promise((resolve) =>
    nh().isAuthorized(
      HEALTH_TYPES,
      (auth: boolean) => resolve(auth),
      () => resolve(false)
    )
  );
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function querySum(dataType: string): Promise<number> {
  if (!nh()?.query) return 0;
  return new Promise((resolve) =>
    nh().query(
      { startDate: todayStart(), endDate: new Date(), dataType },
      (data: { value: number }[]) =>
        resolve(Math.round(data.reduce((s, d) => s + (d.value ?? 0), 0))),
      () => resolve(0)
    )
  );
}

async function queryAvg(dataType: string): Promise<number | undefined> {
  if (!nh()?.query) return undefined;
  return new Promise((resolve) =>
    nh().query(
      { startDate: todayStart(), endDate: new Date(), dataType },
      (data: { value: number }[]) => {
        if (!data.length) { resolve(undefined); return; }
        resolve(Math.round(data.reduce((s, d) => s + (d.value ?? 0), 0) / data.length));
      },
      () => resolve(undefined)
    )
  );
}

export async function fetchTodayHealthData(): Promise<TodayHealthData> {
  const [steps, calories, distanceMeters, avgHR] = await Promise.all([
    querySum("steps"),
    querySum("calories"),
    querySum("distance"),
    queryAvg("heart_rate"),
  ]);

  return {
    steps,
    calories: calories || Math.round(steps * 0.04),
    distanceKm: distanceMeters
      ? parseFloat((distanceMeters / 1000).toFixed(2))
      : parseFloat((steps * 0.000762).toFixed(2)),
    avgHeartRate: avgHR,
    source: getHealthSource(),
  };
}
