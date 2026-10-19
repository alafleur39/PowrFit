// Personal records (Phase 4, P4-03, decision D22).
//
// A PR is the heaviest finished set of an exercise, compared in kg, that
// beats every earlier workout's heaviest set of that exercise. The first
// time an exercise is done doesn't count, and a tie isn't a PR. Records are
// worked out from history on every read, never stored, so editing or
// deleting a workout updates them.

import { convertWeight } from "./units";
import type { LoggedSet, WeightUnit, WorkoutLog } from "./types";

export type PersonalRecord = {
  exerciseId: string;
  exerciseName: string;
  /** The record set, in the unit it was entered in. */
  weight: number;
  unit: WeightUnit;
  reps: number;
};

/** Below this, two weights in kg are the same (float noise from converting). */
const EPSILON_KG = 1e-6;

const toKg = (set: Pick<LoggedSet, "weight" | "unit">) => convertWeight(set.weight, set.unit, "kg");

/** Oldest first; ties broken by start time, then id, so the order is stable. */
function chronological(logs: readonly WorkoutLog[]): WorkoutLog[] {
  return [...logs].sort(
    (a, b) =>
      a.endedAt.localeCompare(b.endedAt) ||
      a.startedAt.localeCompare(b.startedAt) ||
      a.id.localeCompare(b.id)
  );
}

/** The heaviest finished set of each exercise in one workout. */
function heaviestSets(log: WorkoutLog): Map<string, { set: LoggedSet; name: string }> {
  const result = new Map<string, { set: LoggedSet; name: string }>();
  for (const exercise of log.exercises) {
    for (const set of exercise.sets) {
      if (!set.done) continue;
      const current = result.get(exercise.exerciseId);
      if (!current || toKg(set) > toKg(current.set) + EPSILON_KG) {
        result.set(exercise.exerciseId, { set, name: exercise.exerciseName });
      }
    }
  }
  return result;
}

/** The heaviest finished set of each exercise across `logs`, in kg. */
export function bestWeightsKg(logs: readonly WorkoutLog[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const log of logs) {
    for (const [exerciseId, { set }] of heaviestSets(log)) {
      best.set(exerciseId, Math.max(best.get(exerciseId) ?? 0, toKg(set)));
    }
  }
  return best;
}

/** True when `set` beats an earlier best (undefined: never done before). */
export function beatsBest(
  set: Pick<LoggedSet, "weight" | "unit">,
  bestKg: number | undefined
): boolean {
  return bestKg !== undefined && toKg(set) > bestKg + EPSILON_KG;
}

/** The PRs set in each workout, keyed by workout id. Workouts without any are left out. */
export function recordsByLog(logs: readonly WorkoutLog[]): Map<string, PersonalRecord[]> {
  const best = new Map<string, number>();
  const result = new Map<string, PersonalRecord[]>();
  for (const log of chronological(logs)) {
    const records: PersonalRecord[] = [];
    const heaviest = heaviestSets(log);
    for (const [exerciseId, { set, name }] of heaviest) {
      if (beatsBest(set, best.get(exerciseId))) {
        records.push({ exerciseId, exerciseName: name, weight: set.weight, unit: set.unit, reps: set.reps });
      }
    }
    for (const [exerciseId, { set }] of heaviest) {
      best.set(exerciseId, Math.max(best.get(exerciseId) ?? 0, toKg(set)));
    }
    if (records.length > 0) result.set(log.id, records);
  }
  return result;
}
