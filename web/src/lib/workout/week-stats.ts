import { workoutTotals, type WeightUnit } from "@/lib/strength";
import { weekStart } from "./format";
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

/**
 * Weeks in a row (Monday-start, device time) with at least one workout,
 * counting back from this week (P6-13). A week with no workout yet doesn't
 * break the streak until it's over, so it counts back from last week then.
 */
export function weekStreak(endedAt: readonly string[], now: Date): number {
  const weeks = new Set(endedAt.map((iso) => weekStart(new Date(iso)).getTime()));
  const cursor = weekStart(now);
  if (!weeks.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 7);
  let streak = 0;
  while (weeks.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}
