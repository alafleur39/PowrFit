// Converts Routine to and from Firestore documents (P4-01). Like the workout
// codec, decode checks every field, and a document from a newer app version
// is reported as "unsupported".

import { EXERCISES, type Routine, type RoutineExercise } from "@/lib/strength";

export const ROUTINE_SCHEMA_VERSION = 1;

export type RoutineDecodeResult =
  | { ok: true; routine: Routine }
  | { ok: false; reason: "unsupported" | "invalid"; detail: string };

type Data = Record<string, unknown>;

const CATALOG_IDS = new Set(EXERCISES.map((exercise) => exercise.id));

/** Firestore rejects undefined values, so optional fields are left out. */
export function encodeRoutine(routine: Routine): Data {
  return {
    id: routine.id,
    schemaVersion: ROUTINE_SCHEMA_VERSION,
    name: routine.name,
    ...(routine.notes !== undefined && { notes: routine.notes }),
    exercises: routine.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      targetSets: exercise.targetSets,
      ...(exercise.targetReps !== undefined && { targetReps: exercise.targetReps }),
      ...(exercise.restSec !== undefined && { restSec: exercise.restSec }),
    })),
    createdAt: routine.createdAt,
    updatedAt: routine.updatedAt,
  };
}

const isObject = (value: unknown): value is Data =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isWhole = (value: unknown, min: number): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= min;

function decodeExercise(value: unknown): RoutineExercise | null {
  if (!isObject(value)) return null;
  const { exerciseId, targetSets, targetReps, restSec } = value;
  if (typeof exerciseId !== "string" || !CATALOG_IDS.has(exerciseId)) return null;
  if (!isWhole(targetSets, 1)) return null;
  if (targetReps !== undefined && typeof targetReps !== "string") return null;
  if (restSec !== undefined && !isWhole(restSec, 0)) return null;
  return {
    exerciseId,
    targetSets,
    ...(targetReps !== undefined && { targetReps }),
    ...(restSec !== undefined && { restSec }),
  };
}

const invalid = (detail: string): RoutineDecodeResult => ({ ok: false, reason: "invalid", detail });

export function decodeRoutine(docId: string, data: unknown): RoutineDecodeResult {
  if (!isObject(data)) return invalid("not an object");
  if (data.schemaVersion !== ROUTINE_SCHEMA_VERSION) {
    return { ok: false, reason: "unsupported", detail: `schemaVersion ${String(data.schemaVersion)}` };
  }
  const { id, name, notes, exercises, createdAt, updatedAt } = data;
  if (id !== docId) return invalid("id does not match the document id");
  if (typeof name !== "string") return invalid("name must be a string");
  if (notes !== undefined && typeof notes !== "string") return invalid("notes must be a string");
  if (typeof createdAt !== "string" || typeof updatedAt !== "string") {
    return invalid("timestamps must be strings");
  }
  if (!Array.isArray(exercises)) return invalid("exercises must be a list");
  const decoded = exercises.map(decodeExercise);
  if (decoded.some((exercise) => exercise === null)) return invalid("bad exercise");

  return {
    ok: true,
    routine: {
      id: docId,
      name,
      ...(notes !== undefined && { notes }),
      exercises: decoded as RoutineExercise[],
      createdAt,
      updatedAt,
    },
  };
}
