// The user's own routines (Phase 4, P4-01, decision D21).
//
// Pure, like draft.ts: every function returns a new routine, and ids and
// timestamps are passed in. The editor works on a routine that may be
// invalid while it's being typed (an empty name, no exercises);
// routineProblems says what has to be fixed before it can be saved. The
// same limits are enforced by firestore.rules.

import { EXERCISES } from "./exercises";
import type { Routine, RoutineExercise, WorkoutLog } from "./types";

export const ROUTINE_LIMITS = {
  name: 60,
  notes: 300,
  exercises: 30,
  targetSets: 10,
  targetReps: 20,
  restSec: 600,
} as const;

/** Sets and reps an exercise gets when it's added in the editor. */
export const DEFAULT_TARGET_SETS = 3;
export const DEFAULT_TARGET_REPS = "8–12";

const CATALOG_IDS = new Set(EXERCISES.map((exercise) => exercise.id));

export function isPresetRoutine(routine: Pick<Routine, "id">): boolean {
  return routine.id.startsWith("preset-");
}

export function newRoutine(options: { id: string; now: string }): Routine {
  return { id: options.id, name: "", exercises: [], createdAt: options.now, updatedAt: options.now };
}

/** An editable copy of a preset (or any routine) under a new id. */
export function copyRoutine(
  routine: Routine,
  options: { id: string; now: string }
): Routine {
  return {
    id: options.id,
    name: routine.name,
    ...(routine.notes !== undefined && { notes: routine.notes }),
    exercises: routine.exercises.map((exercise) => ({ ...exercise })),
    createdAt: options.now,
    updatedAt: options.now,
  };
}

/** "8" when every set had the same reps, otherwise "6–8". */
function repsTarget(reps: number[]): string {
  const low = Math.min(...reps);
  const high = Math.max(...reps);
  return low === high ? String(low) : `${low}–${high}`;
}

/**
 * A routine that repeats a finished workout: same exercises in the same
 * order, one target set per finished set, and the reps that were done.
 */
export function routineFromWorkout(
  log: WorkoutLog,
  options: { id: string; now: string; name: string }
): Routine {
  const exercises: RoutineExercise[] = log.exercises
    .map((exercise) => exercise.sets.filter((set) => set.done))
    .flatMap((done, index) => {
      if (done.length === 0) return [];
      return [
        {
          exerciseId: log.exercises[index].exerciseId,
          targetSets: Math.min(done.length, ROUTINE_LIMITS.targetSets),
          targetReps: repsTarget(done.map((set) => set.reps)),
        },
      ];
    })
    .slice(0, ROUTINE_LIMITS.exercises);

  return {
    id: options.id,
    name: options.name.slice(0, ROUTINE_LIMITS.name),
    exercises,
    createdAt: options.now,
    updatedAt: options.now,
  };
}

function touched(routine: Routine, now: string, change: Partial<Routine>): Routine {
  return { ...routine, ...change, updatedAt: now };
}

function assertIndex(routine: Routine, index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= routine.exercises.length) {
    throw new RangeError(`Unknown routine exercise ${index}`);
  }
}

/** Sets the name and notes. Empty notes are removed. */
export function updateRoutineDetails(
  routine: Routine,
  details: { name?: string; notes?: string },
  now: string
): Routine {
  const next = touched(routine, now, {});
  if (details.name !== undefined) next.name = details.name;
  if (details.notes !== undefined) {
    if (details.notes.trim() === "") delete next.notes;
    else next.notes = details.notes;
  }
  return next;
}

export function addRoutineExercise(routine: Routine, exerciseId: string, now: string): Routine {
  if (!CATALOG_IDS.has(exerciseId)) throw new RangeError(`Unknown exercise: ${exerciseId}`);
  return touched(routine, now, {
    exercises: [
      ...routine.exercises,
      { exerciseId, targetSets: DEFAULT_TARGET_SETS, targetReps: DEFAULT_TARGET_REPS },
    ],
  });
}

export function removeRoutineExercise(routine: Routine, index: number, now: string): Routine {
  assertIndex(routine, index);
  return touched(routine, now, {
    exercises: routine.exercises.filter((_, i) => i !== index),
  });
}

/** Moves the exercise at `from` to position `to`. */
export function moveRoutineExercise(
  routine: Routine,
  from: number,
  to: number,
  now: string
): Routine {
  assertIndex(routine, from);
  assertIndex(routine, to);
  const exercises = [...routine.exercises];
  const [moved] = exercises.splice(from, 1);
  exercises.splice(to, 0, moved);
  return touched(routine, now, { exercises });
}

/** Changes targets. An empty reps target or a null rest removes the field. */
export function updateRoutineExercise(
  routine: Routine,
  index: number,
  patch: { targetSets?: number; targetReps?: string; restSec?: number | null },
  now: string
): Routine {
  assertIndex(routine, index);
  return touched(routine, now, {
    exercises: routine.exercises.map((exercise, i) => {
      if (i !== index) return exercise;
      const next: RoutineExercise = { ...exercise };
      if (patch.targetSets !== undefined) next.targetSets = patch.targetSets;
      if (patch.targetReps !== undefined) {
        if (patch.targetReps.trim() === "") delete next.targetReps;
        else next.targetReps = patch.targetReps;
      }
      if (patch.restSec !== undefined) {
        if (patch.restSec === null) delete next.restSec;
        else next.restSec = patch.restSec;
      }
      return next;
    }),
  });
}

const isWhole = (value: number, min: number, max: number) =>
  Number.isInteger(value) && value >= min && value <= max;

/** What has to be fixed before the routine can be saved; empty when it's valid. */
export function routineProblems(routine: Routine): string[] {
  const problems: string[] = [];
  const name = routine.name.trim();
  if (name === "") problems.push("Give the routine a name.");
  if (name.length > ROUTINE_LIMITS.name) {
    problems.push(`Keep the name under ${ROUTINE_LIMITS.name + 1} characters.`);
  }
  if ((routine.notes ?? "").length > ROUTINE_LIMITS.notes) {
    problems.push(`Keep the notes under ${ROUTINE_LIMITS.notes + 1} characters.`);
  }
  if (routine.exercises.length === 0) problems.push("Add at least one exercise.");
  if (routine.exercises.length > ROUTINE_LIMITS.exercises) {
    problems.push(`A routine can have up to ${ROUTINE_LIMITS.exercises} exercises.`);
  }
  routine.exercises.forEach((exercise, i) => {
    const label = `Exercise ${i + 1}`;
    if (!CATALOG_IDS.has(exercise.exerciseId)) problems.push(`${label} isn't in the catalog.`);
    if (!isWhole(exercise.targetSets, 1, ROUTINE_LIMITS.targetSets)) {
      problems.push(`${label}: sets must be 1 to ${ROUTINE_LIMITS.targetSets}.`);
    }
    if ((exercise.targetReps ?? "").length > ROUTINE_LIMITS.targetReps) {
      problems.push(`${label}: keep the reps target short.`);
    }
    if (exercise.restSec !== undefined && !isWhole(exercise.restSec, 0, ROUTINE_LIMITS.restSec)) {
      problems.push(`${label}: rest must be 0 to ${ROUTINE_LIMITS.restSec} seconds.`);
    }
  });
  return problems;
}

/** Trims the name and notes for saving. Call after routineProblems is empty. */
export function cleanRoutine(routine: Routine): Routine {
  const notes = routine.notes?.trim();
  const next: Routine = { ...routine, name: routine.name.trim() };
  if (notes) next.notes = notes;
  else delete next.notes;
  return next;
}
