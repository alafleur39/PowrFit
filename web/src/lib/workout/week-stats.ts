import { workoutTotals, type WeightUnit } from "@/lib/strength";
import type { HistoryItem } from "./history-merge";

export type WeekStats = { workouts: number; sets: number; volume: number; unit: WeightUnit };

/**
 * This week's totals from the same items History shows, through the same
 * workoutTotals, so Home and History can't disagree (P2-12). Failed saves
 * are left out: they aren't in the user's account.
 */
export function summarizeWeek(items: readonly HistoryItem[], unit: WeightUnit): WeekStats {
  const logs = items.flatMap((item) => ("log" in item && item.status !== "failed" ? [item.log] : []));
  const totals = workoutTotals(
    logs.flatMap((log) => log.exercises),
    unit
  );
  return { workouts: logs.length, sets: totals.sets, volume: totals.volume, unit };
}
