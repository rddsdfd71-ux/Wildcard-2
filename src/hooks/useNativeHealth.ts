/**
 * Hook that wraps the native health service.
 * Safe to call on web — returns isNative=false and status="unavailable".
 * No @capacitor/core import — uses window.Capacitor runtime detection.
 */

import { useState, useEffect, useCallback } from "react";
import {
  isNativePlatform,
  getNativePlatform,
  isHealthAvailable,
  checkHealthPermissions,
  requestHealthPermissions,
  fetchTodayHealthData,
  type TodayHealthData,
} from "@/services/healthService";

export type ConnectionStatus =
  | "checking"
  | "unavailable"
  | "needs_permission"
  | "connected"
  | "error";

export function useNativeHealth() {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [data, setData] = useState<TodayHealthData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // These don't change after mount — safe to read once
  const isNative = isNativePlatform();
  const platform = getNativePlatform();

  const checkAndLoad = useCallback(async () => {
    if (!isNative) { setStatus("unavailable"); return; }
    try {
      const available = await isHealthAvailable();
      if (!available) { setStatus("unavailable"); return; }

      const hasPerm = await checkHealthPermissions();
      if (!hasPerm) { setStatus("needs_permission"); return; }

      setStatus("connected");
      const today = await fetchTodayHealthData();
      setData(today);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, [isNative]);

  useEffect(() => {
    checkAndLoad();
    const interval = setInterval(checkAndLoad, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAndLoad]);

  const connect = useCallback(async (): Promise<boolean> => {
    setStatus("checking");
    try {
      const granted = await requestHealthPermissions();
      if (granted) {
        setStatus("connected");
        const today = await fetchTodayHealthData();
        setData(today);
        return true;
      }
      setStatus("needs_permission");
      return false;
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Permission denied");
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (status !== "connected") return;
    try {
      const today = await fetchTodayHealthData();
      setData(today);
    } catch {
      // silent
    }
  }, [status]);

  const sourceName =
    platform === "ios" ? "Apple Health" :
    platform === "android" ? "Google Fit" :
    "Health";

  return {
    isNative,
    platform,
    status,
    data,
    error,
    connect,
    refresh,
    sourceName,
    isConnected: status === "connected",
    isChecking: status === "checking",
    needsPermission: status === "needs_permission",
  };
}
