// Progress charts (Phase 4, P4-06, decision D25). Pure, so the buckets can
// be tested without a browser. Buckets use the device's local calendar, like
// weekStart: a workout belongs to the day it ended on, where the user is.

import { convertWeight, roundWeight, workoutTotals, type WeightUnit, type WorkoutLog } from "@/lib/strength";
import { weekStart } from "./format";

export type ProgressRange = "week" | "month" | "year";

export type VolumeBucket = {
  /** Short axis label: "Mon", "Oct 6", "Jan". */
  label: string;
  /** Longer label for screen readers: "Monday, Oct 13", "Week of Oct 6", "January". */
  longLabel: string;
  start: Date;
  workouts: number;
  /** Total volume in the chart's unit, rounded once. */
  volume: number;
};

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/** Bucket start dates for the range containing `now`, oldest first. */
function bucketStarts(range: ProgressRange, now: Date): Date[] {
  if (range === "week") {
    const monday = weekStart(now);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }
  if (range === "month") {
    // Every Monday-start week that overlaps this month.
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const starts: Date[] = [];
    for (let start = weekStart(first); start < nextMonth; start = addDays(start, 7)) {
      starts.push(start);
    }
    return starts;
  }
  return Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), i, 1));
}

function labels(range: ProgressRange, start: Date): { label: string; longLabel: string } {
  if (range === "week") {
    return {
      label: start.toLocaleDateString("en-US", { weekday: "short" }),
      longLabel: start.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    };
  }
  if (range === "month") {
    const day = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { label: day, longLabel: `Week of ${day}` };
  }
  return {
    label: start.toLocaleDateString("en-US", { month: "short" }),
    longLabel: start.toLocaleDateString("en-US", { month: "long" }),
  };
}

/** Volume per day (week), per week (month) or per month (year), in `unit`. */
export function volumeBuckets(
  logs: readonly WorkoutLog[],
  range: ProgressRange,
  unit: WeightUnit,
  now: Date
): VolumeBucket[] {
  const starts = bucketStarts(range, now);
  const end =
    range === "week"
      ? addDays(starts[0], 7)
      : range === "month"
        ? addDays(starts[starts.length - 1], 7)
        : new Date(now.getFullYear() + 1, 0, 1);
  const grouped = starts.map(() => [] as WorkoutLog[]);

  for (const log of logs) {
    const ended = new Date(log.endedAt);
    if (ended < starts[0] || ended >= end) continue;
    // The last bucket that started at or before the workout ended.
    let index = starts.length - 1;
    while (starts[index] > ended) index -= 1;
    grouped[index].push(log);
  }

  return starts.map((start, i) => ({
    ...labels(range, start),
    start,
    workouts: grouped[i].length,
    volume: workoutTotals(
      grouped[i].flatMap((log) => log.exercises),
      unit
    ).volume,
  }));
}

export type TrendPoint = { logId: string; endedAt: string; weight: number };

/**
 * The heaviest finished set of one exercise in each workout that has it,
 * oldest first, converted to `unit`.
 */
export function exerciseTrend(
  logs: readonly WorkoutLog[],
  exerciseId: string,
  unit: WeightUnit
): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (const log of logs) {
    let best: number | null = null;
    for (const exercise of log.exercises) {
      if (exercise.exerciseId !== exerciseId) continue;
      for (const set of exercise.sets) {
        if (!set.done) continue;
        const weight = convertWeight(set.weight, set.unit, unit);
        if (best === null || weight > best) best = weight;
      }
    }
    if (best !== null) points.push({ logId: log.id, endedAt: log.endedAt, weight: roundWeight(best, unit) });
  }
  return points.sort((a, b) => a.endedAt.localeCompare(b.endedAt) || a.logId.localeCompare(b.logId));
}

export type TrendExercise = { exerciseId: string; exerciseName: string; workouts: number };

/** Exercises with finished sets, most-logged first, for the trend picker. */
export function trendExercises(logs: readonly WorkoutLog[]): TrendExercise[] {
  const byId = new Map<string, TrendExercise>();
  for (const log of logs) {
    const seen = new Set<string>();
    for (const exercise of log.exercises) {
      if (seen.has(exercise.exerciseId) || !exercise.sets.some((set) => set.done)) continue;
      seen.add(exercise.exerciseId);
      const entry = byId.get(exercise.exerciseId) ?? {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        workouts: 0,
      };
      entry.workouts += 1;
      byId.set(exercise.exerciseId, entry);
    }
  }
  return [...byId.values()].sort(
    (a, b) => b.workouts - a.workouts || a.exerciseName.localeCompare(b.exerciseName)
  );
}
