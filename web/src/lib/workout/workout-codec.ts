// Converts WorkoutLog to and from Firestore documents (P2-05).
//
// Documents are written by this app but read back from a cache and a server
// we don't control, so decode checks every field instead of trusting a cast.
// A document from a newer app version is reported as "unsupported" rather
// than guessed at.

import {
  WEIGHT_UNITS,
  WORKOUT_LOG_SCHEMA_VERSION,
  type LoggedExercise,
  type LoggedSet,
  type WorkoutLog,
  type WorkoutTotals,
} from "@/lib/strength";

export type DecodeResult =
  | { ok: true; log: WorkoutLog }
  | { ok: false; reason: "unsupported" | "invalid"; detail: string };

type Data = Record<string, unknown>;

/** Firestore rejects undefined values, so optional fields are left out. */
export function encodeWorkoutLog(log: WorkoutLog): Data {
  return {
    id: log.id,
    schemaVersion: log.schemaVersion,
    ...(log.routineId !== undefined && { routineId: log.routineId }),
    ...(log.routineName !== undefined && { routineName: log.routineName }),
    startedAt: log.startedAt,
    endedAt: log.endedAt,
    updatedAt: log.updatedAt,
    exercises: log.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      ...(exercise.note !== undefined && { note: exercise.note }),
      sets: exercise.sets.map((set) => ({
        reps: set.reps,
        weight: set.weight,
        unit: set.unit,
        done: set.done,
      })),
    })),
    exerciseIds: [...log.exerciseIds],
    totals: { ...log.totals },
  };
}

class InvalidDocument extends Error {}

function fail(detail: string): never {
  throw new InvalidDocument(detail);
}

const isObject = (value: unknown): value is Data =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function string(data: Data, key: string): string {
  const value = data[key];
  if (typeof value !== "string") fail(`${key} must be a string`);
  return value;
}

function optionalString(data: Data, key: string): string | undefined {
  return data[key] === undefined ? undefined : string(data, key);
}

function nonNegative(value: unknown, key: string, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    fail(`${key} must be a non-negative number`);
  }
  if (integer && !Number.isInteger(value)) fail(`${key} must be a whole number`);
  return value;
}

function unit(value: unknown, key: string) {
  if (!(WEIGHT_UNITS as readonly unknown[]).includes(value)) fail(`${key} must be kg or lb`);
  return value as LoggedSet["unit"];
}

function decodeSet(value: unknown, path: string): LoggedSet {
  if (!isObject(value)) fail(`${path} must be an object`);
  if (typeof value.done !== "boolean") fail(`${path}.done must be a boolean`);
  return {
    reps: nonNegative(value.reps, `${path}.reps`, true),
    weight: nonNegative(value.weight, `${path}.weight`),
    unit: unit(value.unit, `${path}.unit`),
    done: value.done,
  };
}

function decodeExercise(value: unknown, path: string): LoggedExercise {
  if (!isObject(value)) fail(`${path} must be an object`);
  if (!Array.isArray(value.sets)) fail(`${path}.sets must be a list`);
  const note = optionalString(value, "note");
  return {
    exerciseId: string(value, "exerciseId"),
    exerciseName: string(value, "exerciseName"),
    ...(note !== undefined && { note }),
    sets: value.sets.map((set, i) => decodeSet(set, `${path}.sets[${i}]`)),
  };
}

function decodeTotals(value: unknown): WorkoutTotals {
  if (!isObject(value)) fail("totals must be an object");
  return {
    sets: nonNegative(value.sets, "totals.sets", true),
    reps: nonNegative(value.reps, "totals.reps", true),
    volume: nonNegative(value.volume, "totals.volume"),
    unit: unit(value.unit, "totals.unit"),
  };
}

/** Checks a Firestore document and returns the log, or why it can't be shown. */
export function decodeWorkoutLog(docId: string, data: unknown): DecodeResult {
  if (!isObject(data)) return { ok: false, reason: "invalid", detail: "not an object" };
  if (data.schemaVersion !== WORKOUT_LOG_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: "unsupported",
      detail: `schemaVersion ${String(data.schemaVersion)}`,
    };
  }

  try {
    const id = string(data, "id");
    if (id !== docId) fail("id does not match the document id");
    if (!Array.isArray(data.exercises)) fail("exercises must be a list");
    if (!Array.isArray(data.exerciseIds) || !data.exerciseIds.every((v) => typeof v === "string")) {
      fail("exerciseIds must be a list of strings");
    }
    const routineId = optionalString(data, "routineId");
    const routineName = optionalString(data, "routineName");

    return {
      ok: true,
      log: {
        id,
        schemaVersion: WORKOUT_LOG_SCHEMA_VERSION,
        ...(routineId !== undefined && { routineId }),
        ...(routineName !== undefined && { routineName }),
        startedAt: string(data, "startedAt"),
        endedAt: string(data, "endedAt"),
        updatedAt: string(data, "updatedAt"),
        exercises: data.exercises.map((exercise, i) => decodeExercise(exercise, `exercises[${i}]`)),
        exerciseIds: [...(data.exerciseIds as string[])],
        totals: decodeTotals(data.totals),
      },
    };
  } catch (error) {
    if (error instanceof InvalidDocument) {
      return { ok: false, reason: "invalid", detail: error.message };
    }
    throw error;
  }
}
