// Workout drafts: the in-progress workout the logger edits (P2-03).
//
// Every function is pure: it returns a new draft and never mutates its input.
// Ids and timestamps are passed in, so callers own randomness and time and
// tests stay deterministic. finishDraft turns a draft into the WorkoutLog that
// gets saved; only sets marked done survive it (Phase 2 plan, section B).
// Cardio exercises (2026-11-02) get cardio sets: a time plus optional stats,
// and no rest timer.

import { EXERCISES } from "./exercises";
import { workoutTotals } from "./totals";
import {
  WORKOUT_LOG_SCHEMA_VERSION,
  type CardioSet,
  type DistanceUnit,
  type LoggedExercise,
  type LoggedSet,
  type Routine,
  type WeightUnit,
  type WorkoutLog,
  type WorkoutTotals,
} from "./types";

/** A set as typed so far; null means the field is still empty. */
export type DraftStrengthSet = {
  reps: number | null;
  weight: number | null;
  unit: WeightUnit;
  done: boolean;
};

/** A cardio set as typed so far; only the time is needed to finish it. */
export type DraftCardioSet = {
  durationSec: number | null;
  distance: number | null;
  distanceUnit: DistanceUnit;
  level: number | null;
  floors: number | null;
  inclinePct: number | null;
  calories: number | null;
  done: boolean;
};

export type DraftSet = DraftStrengthSet | DraftCardioSet;

export function isDraftCardioSet(set: DraftSet): set is DraftCardioSet {
  return "durationSec" in set;
}

/** What updateSet can change. */
export type DraftSetPatch =
  | Partial<Pick<DraftStrengthSet, "weight" | "reps">>
  | Partial<Omit<DraftCardioSet, "done" | "distanceUnit">>;

const CARDIO_STATS = ["distance", "level", "floors", "inclinePct", "calories"] as const;

export type DraftExercise = {
  /** Stable within the draft, so the same exercise can appear twice. */
  key: string;
  exerciseId: string;
  exerciseName: string;
  /** Target from the routine, shown as a hint ("8–12"). */
  targetReps?: string;
  /** Rest after each set, from the routine; DEFAULT_REST_SEC when absent. */
  restSec?: number;
  /** Free text for this exercise (P5-02, D27); saved with the workout. */
  note?: string;
  sets: DraftSet[];
};

/** The running rest timer (P4-04, D23). */
export type DraftRest = {
  /** When the rest is over. A wall-clock time, so a reload keeps it. */
  endsAt: string;
  /** Length of the rest, for the progress bar. */
  durationSec: number;
};

/** Rest between sets unless the routine says otherwise (D17). */
export const DEFAULT_REST_SEC = 90;

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
  /** Set while resting after a ticked set. */
  rest?: DraftRest;
};

const EXERCISES_BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));

function exerciseName(exerciseId: string): string {
  const exercise = EXERCISES_BY_ID.get(exerciseId);
  if (!exercise) throw new RangeError(`Unknown exercise: ${exerciseId}`);
  return exercise.name;
}

/** True for treadmill, stair climber and the other cardio machines. */
export function isCardioExercise(exerciseId: string): boolean {
  return EXERCISES_BY_ID.get(exerciseId)?.cardio !== undefined;
}

/** Distances follow the weight unit: miles with lb, kilometres with kg. */
export const distanceUnitFor = (unit: WeightUnit): DistanceUnit => (unit === "lb" ? "mi" : "km");

function emptySet(exerciseId: string, unit: WeightUnit): DraftSet {
  if (isCardioExercise(exerciseId)) {
    return {
      durationSec: null,
      distance: null,
      distanceUnit: distanceUnitFor(unit),
      level: null,
      floors: null,
      inclinePct: null,
      calories: null,
      done: false,
    };
  }
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
    ...(item.restSec !== undefined && { restSec: item.restSec }),
    sets: Array.from({ length: item.targetSets }, () => emptySet(item.exerciseId, unit)),
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

/** Longest exercise note (D27), the same as a routine's notes. */
export const EXERCISE_NOTE_LIMIT = 300;

/** Sets an exercise's note; text past the limit is cut, and "" removes it. */
export function setExerciseNote(
  draft: WorkoutDraft,
  key: string,
  note: string,
  now: string
): WorkoutDraft {
  return updateExercise(draft, key, now, (exercise) => {
    const next = { ...exercise };
    if (note === "") delete next.note;
    else next.note = note.slice(0, EXERCISE_NOTE_LIMIT);
    return next;
  });
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
    sets: [emptySet(exerciseId, draft.unit)],
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

/** Adds a set that copies the previous set's numbers (not done). */
export function addSet(draft: WorkoutDraft, key: string, now: string): WorkoutDraft {
  return updateExercise(draft, key, now, (exercise) => {
    const previous = exercise.sets.at(-1);
    const next: DraftSet = previous
      ? { ...previous, done: false }
      : emptySet(exercise.exerciseId, draft.unit);
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

/**
 * A set can be marked done once it has a weight (0 is fine) and at least 1
 * rep; a cardio set once it has a time.
 */
export function canCompleteSet(set: DraftSet): boolean {
  if (isDraftCardioSet(set)) return set.durationSec !== null && set.durationSec >= 1;
  return set.weight !== null && set.reps !== null && set.reps >= 1;
}

function assertCardioPatch(patch: DraftSetPatch): void {
  for (const [key, value] of Object.entries(patch)) {
    if (key === "weight" || key === "reps" || value === null || value === undefined) continue;
    const whole = key === "durationSec" || key === "floors" || key === "calories";
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || (whole && !Number.isInteger(value))) {
      throw new RangeError(`Invalid ${key}: ${value}`);
    }
  }
}

/**
 * Changes a set's weight or reps, or a cardio set's time and stats. A done
 * set that stops being completable (for example its reps are cleared) is
 * unmarked.
 */
export function updateSet(
  draft: WorkoutDraft,
  key: string,
  index: number,
  patch: DraftSetPatch,
  now: string
): WorkoutDraft {
  if ("weight" in patch) assertWeight(patch.weight ?? null);
  if ("reps" in patch) assertReps(patch.reps ?? null);
  assertCardioPatch(patch);

  return updateExercise(draft, key, now, (exercise) => {
    assertSetIndex(exercise, index);
    return {
      ...exercise,
      sets: exercise.sets.map((set, i) => {
        if (i !== index) return set;
        const next = { ...set, ...patch } as DraftSet;
        return { ...next, done: next.done && canCompleteSet(next) };
      }),
    };
  });
}

const addSeconds = (iso: string, seconds: number) =>
  new Date(Date.parse(iso) + seconds * 1000).toISOString();

/**
 * Toggles done. Marking an incomplete set done returns the draft unchanged.
 * Marking a set done starts the rest timer with the exercise's rest time.
 */
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

  const next = updateExercise(draft, key, now, (current) => ({
    ...current,
    sets: current.sets.map((item, i) => (i === index ? { ...item, done: !item.done } : item)),
  }));
  if (set.done || isDraftCardioSet(set)) return next;
  const durationSec = exercise.restSec ?? DEFAULT_REST_SEC;
  if (durationSec === 0) return next;
  return { ...next, rest: { endsAt: addSeconds(now, durationSec), durationSec } };
}

/** Adds (or with a negative delta, takes off) rest time. Never ends before `now`. */
export function adjustRest(draft: WorkoutDraft, deltaSec: number, now: string): WorkoutDraft {
  if (!draft.rest) return draft;
  const endsAt = Math.max(Date.parse(draft.rest.endsAt) + deltaSec * 1000, Date.parse(now));
  return {
    ...draft,
    updatedAt: now,
    rest: {
      endsAt: new Date(endsAt).toISOString(),
      durationSec: Math.max(1, draft.rest.durationSec + deltaSec),
    },
  };
}

/** Stops the rest timer. */
export function skipRest(draft: WorkoutDraft, now: string): WorkoutDraft {
  if (!draft.rest) return draft;
  const next = { ...draft, updatedAt: now };
  delete next.rest;
  return next;
}

/** Unit for new sets; sets already entered keep theirs. */
export function setDraftUnit(draft: WorkoutDraft, unit: WeightUnit, now: string): WorkoutDraft {
  return { ...draft, unit, updatedAt: now };
}

/** A finished draft set as it's saved: empty cardio stats are left out. */
function toLoggedSet(set: DraftSet): LoggedSet {
  if (!isDraftCardioSet(set)) {
    return { reps: set.reps as number, weight: set.weight as number, unit: set.unit, done: true };
  }
  const logged: CardioSet = { durationSec: set.durationSec as number, done: true };
  for (const stat of CARDIO_STATS) {
    const value = set[stat];
    if (value !== null) logged[stat] = value;
  }
  if (logged.distance !== undefined) logged.distanceUnit = set.distanceUnit;
  return logged;
}

function doneLoggedExercises(draft: WorkoutDraft): LoggedExercise[] {
  return draft.exercises
    .map((exercise) => ({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      ...(exercise.note?.trim() && { note: exercise.note.trim() }),
      sets: exercise.sets
        .filter((set) => set.done && canCompleteSet(set))
        .map(toLoggedSet),
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
