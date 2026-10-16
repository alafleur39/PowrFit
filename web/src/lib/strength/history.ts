// "Last time" lookup for the logger and exercise detail (P1-06).
//
// Finds the most recent workout in which the exercise has at least one done
// set, so a workout where it was skipped falls back to the one before.

import type { LoggedSet, WorkoutLog } from "./types";

export type LastSets = {
  logId: string;
  /** When that workout started, for "Last time (Oct 12)" labels. */
  startedAt: string;
  /** Done sets in logged order, copied so callers can't edit history. */
  sets: LoggedSet[];
};

/** Unparseable dates sort as oldest rather than breaking the comparison. */
function startTime(log: WorkoutLog): number {
  const time = Date.parse(log.startedAt);
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

function doneSets(log: WorkoutLog, exerciseId: string): LoggedSet[] {
  // An exercise logged twice in one workout contributes both entries.
  return log.exercises
    .filter((exercise) => exercise.exerciseId === exerciseId)
    .flatMap((exercise) => exercise.sets.filter((set) => set.done))
    .map((set) => ({ ...set }));
}

/** Returns the newest done sets for `exerciseId`, or null if there are none. */
export function lastSetsForExercise(
  logs: readonly WorkoutLog[],
  exerciseId: string
): LastSets | null {
  let best: { log: WorkoutLog; time: number; sets: LoggedSet[] } | null = null;

  for (const log of logs) {
    const time = startTime(log);
    if (best && time <= best.time) continue;
    const sets = doneSets(log, exerciseId);
    if (sets.length > 0) best = { log, time, sets };
  }

  return best && { logId: best.log.id, startedAt: best.log.startedAt, sets: best.sets };
}
