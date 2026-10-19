// Editing a finished workout (Phase 4, P4-05, decision D24).
//
// Pure, like draft.ts: every function returns a new log and timestamps are
// passed in. Weights and reps can change and sets or exercises can be
// removed; start and end times never change. While editing, a log may be
// invalid (an exercise with no sets left); logProblems says what to fix and
// cleanEditedLog drops the empty exercises and recomputes what's derived.

import { workoutTotals } from "./totals";
import type { LoggedExercise, LoggedSet, WorkoutLog } from "./types";

function assertExercise(log: WorkoutLog, index: number): LoggedExercise {
  const exercise = log.exercises[index];
  if (!exercise) throw new RangeError(`Exercise index out of range: ${index}`);
  return exercise;
}

function assertSet(exercise: LoggedExercise, index: number): void {
  if (!exercise.sets[index]) throw new RangeError(`Set index out of range: ${index}`);
}

const touched = (log: WorkoutLog, now: string, exercises: LoggedExercise[]): WorkoutLog => ({
  ...log,
  exercises,
  updatedAt: now,
});

/** Changes a set's weight (in the set's own unit) or reps. */
export function editLogSet(
  log: WorkoutLog,
  exerciseIndex: number,
  setIndex: number,
  patch: { weight?: number; reps?: number },
  now: string
): WorkoutLog {
  const exercise = assertExercise(log, exerciseIndex);
  assertSet(exercise, setIndex);
  return touched(
    log,
    now,
    log.exercises.map((item, i) =>
      i !== exerciseIndex
        ? item
        : {
            ...item,
            sets: item.sets.map((set, j): LoggedSet => (j === setIndex ? { ...set, ...patch } : set)),
          }
    )
  );
}

/** Removes a set. An exercise left with no sets stays until cleanEditedLog. */
export function removeLogSet(
  log: WorkoutLog,
  exerciseIndex: number,
  setIndex: number,
  now: string
): WorkoutLog {
  const exercise = assertExercise(log, exerciseIndex);
  assertSet(exercise, setIndex);
  return touched(
    log,
    now,
    log.exercises.map((item, i) =>
      i !== exerciseIndex ? item : { ...item, sets: item.sets.filter((_, j) => j !== setIndex) }
    )
  );
}

export function removeLogExercise(log: WorkoutLog, exerciseIndex: number, now: string): WorkoutLog {
  assertExercise(log, exerciseIndex);
  return touched(
    log,
    now,
    log.exercises.filter((_, i) => i !== exerciseIndex)
  );
}

/** What has to be fixed before the edit can be saved; empty when it's valid. */
export function logProblems(log: WorkoutLog): string[] {
  const problems: string[] = [];
  const sets = log.exercises.flatMap((exercise) => exercise.sets);
  if (sets.length === 0) {
    problems.push("Keep at least one set, or delete the workout instead.");
  }
  if (sets.some((set) => !Number.isInteger(set.reps) || set.reps < 1)) {
    problems.push("Every set needs at least 1 rep.");
  }
  if (sets.some((set) => !Number.isFinite(set.weight) || set.weight < 0)) {
    problems.push("Weights can't be negative or empty.");
  }
  return problems;
}

/**
 * The log as it will be saved: exercises with no sets are dropped and the
 * exercise ids and totals are recomputed. Totals keep the unit they were
 * saved in.
 */
export function cleanEditedLog(log: WorkoutLog): WorkoutLog {
  const exercises = log.exercises.filter((exercise) => exercise.sets.length > 0);
  return {
    ...log,
    exercises,
    exerciseIds: [...new Set(exercises.map((exercise) => exercise.exerciseId))],
    totals: workoutTotals(exercises, log.totals.unit),
  };
}
