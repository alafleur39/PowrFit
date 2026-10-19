"use client";

import { useMemo } from "react";

import { recordsByLog, type WorkoutLog } from "@/lib/strength";
import { useRecentWorkouts } from "./use-workout-logs";

/**
 * How many recent workouts PRs and long-range charts read (Phase 4 plan,
 * "Known gap"): years of normal training.
 */
export const HISTORY_LIMIT = 500;

/**
 * Finished workouts for analysis, newest first: synced and pending saves,
 * not failed ones (they aren't part of history until they're saved).
 */
export function useHistoryLogs() {
  const { items, loading, error } = useRecentWorkouts(HISTORY_LIMIT);
  const logs = useMemo<WorkoutLog[]>(
    () => items.flatMap((item) => ("log" in item && item.status !== "failed" ? [item.log] : [])),
    [items]
  );
  return { logs, loading, error };
}

/** PRs set in each workout (D22), keyed by workout id. */
export function useRecords() {
  const { logs, loading } = useHistoryLogs();
  const records = useMemo(() => recordsByLog(logs), [logs]);
  return { records, loading };
}
