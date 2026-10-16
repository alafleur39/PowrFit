// Workout totals: sets, reps and volume (P1-05).
//
// Only sets marked done count. Volume is weight × reps (decision D6), so an
// unweighted bodyweight set adds reps but no volume. Each set's weight is
// converted to the target unit exactly and the sum is rounded once at the end,
// so every screen shows the same number for the same workout.

import type { LoggedExercise, LoggedSet, WeightUnit, WorkoutTotals } from "./types";
import { convertWeight, roundWeight } from "./units";

function assertValidReps(reps: number): void {
  if (!Number.isFinite(reps) || reps < 0) {
    throw new RangeError(`Invalid reps: ${reps}`);
  }
}

/** Unrounded weight × reps of one set, in `unit`. Ignores `done`. */
export function setVolume(set: LoggedSet, unit: WeightUnit): number {
  assertValidReps(set.reps);
  return convertWeight(set.weight, set.unit, unit) * set.reps;
}

/** Totals for one exercise, counting only done sets. */
export function exerciseTotals(
  exercise: LoggedExercise,
  unit: WeightUnit
): WorkoutTotals {
  return workoutTotals([exercise], unit);
}

/** Totals for a whole workout, counting only done sets. */
export function workoutTotals(
  exercises: readonly LoggedExercise[],
  unit: WeightUnit
): WorkoutTotals {
  let sets = 0;
  let reps = 0;
  let volume = 0;

  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      if (!set.done) continue;
      volume += setVolume(set, unit);
      sets += 1;
      reps += set.reps;
    }
  }

  return { sets, reps, volume: roundWeight(volume, unit), unit };
}
