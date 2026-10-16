// Workout drafts: the in-progress workout the logger edits (P2-03).
//
// Every function is pure: it returns a new draft and never mutates its input.
// Ids and timestamps are passed in, so callers own randomness and time and
// tests stay deterministic. finishDraft turns a draft into the WorkoutLog that
// gets saved; only sets marked done survive it (Phase 2 plan, section B).

import { EXERCISES } from "./exercises";
import { workoutTotals } from "./totals";
import {
  WORKOUT_LOG_SCHEMA_VERSION,
  type LoggedExercise,
  type LoggedSet,
  type Routine,
  type WeightUnit,
  type WorkoutLog,
  type WorkoutTotals,
} from "./types";

/** A set as typed so far; null means the field is still empty. */
export type DraftSet = {
  reps: number | null;
  weight: number | null;
  unit: WeightUnit;
  done: boolean;
};

export type DraftExercise = {
  /** Stable within the draft, so the same exercise can appear twice. */
  key: string;
  exerciseId: string;
  exerciseName: string;
  /** Target from the routine, shown as a hint ("8–12"). */
  targetReps?: string;
  sets: DraftSet[];
};

export type WorkoutDraft = {
  /** Becomes WorkoutLog.id and the Firestore document id. */
  id: string;
  startedAt: string;
  updatedAt: string;
  routineId?: string;
  routineName?: string;
  /** Unit for new sets. Existing sets keep their own unit. */
  unit: WeightUnit;
  exercises: DraftExercise[];
  /** Counter for exercise keys. */
  nextKey: number;
};

const EXERCISE_NAMES = new Map(EXERCISES.map((exercise) => [exercise.id, exercise.name]));

function exerciseName(exerciseId: string): string {
  const name = EXERCISE_NAMES.get(exerciseId);
  if (!name) throw new RangeError(`Unknown exercise: ${exerciseId}`);
  return name;
}

function emptySet(unit: WeightUnit): DraftSet {
  return { reps: null, weight: null, unit, done: false };
}

export function createDraft(options: {
  id: string;
  now: string;
  unit: WeightUnit;
  routine?: Routine;
}): WorkoutDraft {
  const { id, now, unit, routine } = options;
  const exercises: DraftExercise[] = (routine?.exercises ?? []).map((item, index) => ({
    key: `e${index}`,
    exerciseId: item.exerciseId,
    exerciseName: exerciseName(item.exerciseId),
    targetReps: item.targetReps,
    sets: Array.from({ length: item.targetSets }, () => emptySet(unit)),
  }));

  return {
    id,
    startedAt: now,
    updatedAt: now,
    ...(routine && { routineId: routine.id, routineName: routine.name }),
    unit,
    exercises,
    nextKey: exercises.length,
  };
}

function updateExercise(
  draft: WorkoutDraft,
  key: string,
  now: string,
  change: (exercise: DraftExercise) => DraftExercise
): WorkoutDraft {
  if (!draft.exercises.some((exercise) => exercise.key === key)) {
    throw new RangeError(`Unknown exercise key: ${key}`);
  }
  return {
    ...draft,
    updatedAt: now,
    exercises: draft.exercises.map((exercise) =>
      exercise.key === key ? change(exercise) : exercise
    ),
  };
}

function assertSetIndex(exercise: DraftExercise, index: number): void {
  if (!Number.isInteger(index) || index < 0 || index >= exercise.sets.length) {
    throw new RangeError(`Unknown set ${index} for ${exercise.key}`);
  }
}

/** Adds an exercise with one empty set. */
export function addExercise(draft: WorkoutDraft, exerciseId: string, now: string): WorkoutDraft {
  const exercise: DraftExercise = {
    key: `e${draft.nextKey}`,
    exerciseId,
    exerciseName: exerciseName(exerciseId),
    sets: [emptySet(draft.unit)],
  };
  return {
    ...draft,
    updatedAt: now,
    exercises: [...draft.exercises, exercise],
    nextKey: draft.nextKey + 1,
  };
}

export function removeExercise(draft: WorkoutDraft, key: string, now: string): WorkoutDraft {
  if (!draft.exercises.some((exercise) => exercise.key === key)) {
    throw new RangeError(`Unknown exercise key: ${key}`);
  }
  return {
    ...draft,
    updatedAt: now,
    exercises: draft.exercises.filter((exercise) => exercise.key !== key),
  };
}

/** Adds a set that copies the previous set's weight and reps (not done). */
export function addSet(draft: WorkoutDraft, key: string, now: string): WorkoutDraft {
  return updateExercise(draft, key, now, (exercise) => {
    const previous = exercise.sets.at(-1);
    const next: DraftSet = previous
      ? { reps: previous.reps, weight: previous.weight, unit: previous.unit, done: false }
      : emptySet(draft.unit);
    return { ...exercise, sets: [...exercise.sets, next] };
  });
}

export function removeSet(
  draft: WorkoutDraft,
  key: string,
  index: number,
  now: string
): WorkoutDraft {
  return updateExercise(draft, key, now, (exercise) => {
    assertSetIndex(exercise, index);
    return { ...exercise, sets: exercise.sets.filter((_, i) => i !== index) };
  });
}

function assertWeight(weight: number | null): void {
  if (weight !== null && (!Number.isFinite(weight) || weight < 0)) {
    throw new RangeError(`Invalid weight: ${weight}`);
  }
}

function assertReps(reps: number | null): void {
  if (reps !== null && (!Number.isInteger(reps) || reps < 0)) {
    throw new RangeError(`Invalid reps: ${reps}`);
  }
}

/** A set can be marked done once it has a weight (0 is fine) and at least 1 rep. */
export function canCompleteSet(set: DraftSet): boolean {
  return set.weight !== null && set.reps !== null && set.reps >= 1;
}

/**
 * Changes a set's weight or reps. A done set that stops being completable
 * (for example its reps are cleared) is unmarked.
 */
export function updateSet(
  draft: WorkoutDraft,
  key: string,
  index: number,
  patch: { weight?: number | null; reps?: number | null },
  now: string
): WorkoutDraft {
  if ("weight" in patch) assertWeight(patch.weight ?? null);
  if ("reps" in patch) assertReps(patch.reps ?? null);

  return updateExercise(draft, key, now, (exercise) => {
    assertSetIndex(exercise, index);
    return {
      ...exercise,
      sets: exercise.sets.map((set, i) => {
        if (i !== index) return set;
        const next = { ...set, ...patch };
        return { ...next, done: next.done && canCompleteSet(next) };
      }),
    };
  });
}

/** Toggles done. Marking an incomplete set done returns the draft unchanged. */
export function toggleSetDone(
  draft: WorkoutDraft,
  key: string,
  index: number,
  now: string
): WorkoutDraft {
  const exercise = draft.exercises.find((item) => item.key === key);
  if (!exercise) throw new RangeError(`Unknown exercise key: ${key}`);
  assertSetIndex(exercise, index);
  const set = exercise.sets[index];
  if (!set.done && !canCompleteSet(set)) return draft;

  return updateExercise(draft, key, now, (current) => ({
    ...current,
    sets: current.sets.map((item, i) => (i === index ? { ...item, done: !item.done } : item)),
  }));
}

/** Unit for new sets; sets already entered keep theirs. */
export function setDraftUnit(draft: WorkoutDraft, unit: WeightUnit, now: string): WorkoutDraft {
  return { ...draft, unit, updatedAt: now };
}

function doneLoggedExercises(draft: WorkoutDraft): LoggedExercise[] {
  return draft.exercises
    .map((exercise) => ({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      sets: exercise.sets
        .filter((set) => set.done && canCompleteSet(set))
        .map(
          (set): LoggedSet => ({
            reps: set.reps as number,
            weight: set.weight as number,
            unit: set.unit,
            done: true,
          })
        ),
    }))
    .filter((exercise) => exercise.sets.length > 0);
}

/** Counts of done and not-done sets, for the finish confirmation. */
export function draftSetCounts(draft: WorkoutDraft): { done: number; notDone: number } {
  let done = 0;
  let notDone = 0;
  for (const exercise of draft.exercises) {
    for (const set of exercise.sets) {
      if (set.done) done += 1;
      else notDone += 1;
    }
  }
  return { done, notDone };
}

/** Live totals of the done sets, using the same rules as saved workouts. */
export function draftTotals(draft: WorkoutDraft, unit: WeightUnit): WorkoutTotals {
  return workoutTotals(doneLoggedExercises(draft), unit);
}

/**
 * Turns the draft into the WorkoutLog to save. Unticked sets and exercises
 * left without done sets are dropped. Throws if nothing was done.
 */
export function finishDraft(draft: WorkoutDraft, now: string): WorkoutLog {
  const exercises = doneLoggedExercises(draft);
  if (exercises.length === 0) {
    throw new RangeError("A workout needs at least one done set to finish");
  }

  return {
    id: draft.id,
    schemaVersion: WORKOUT_LOG_SCHEMA_VERSION,
    ...(draft.routineId && { routineId: draft.routineId }),
    ...(draft.routineName && { routineName: draft.routineName }),
    startedAt: draft.startedAt,
    endedAt: now,
    updatedAt: now,
    exercises,
    exerciseIds: [...new Set(exercises.map((exercise) => exercise.exerciseId))],
    totals: workoutTotals(exercises, draft.unit),
  };
}
