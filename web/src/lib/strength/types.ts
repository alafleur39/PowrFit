// Strength-training domain types (Phase 0 PRD, "Data model").
//
// Pure TypeScript: nothing in src/lib/strength may import Firebase, React or
// browser-only APIs, so the logger, repositories and the future AI agent can
// all share it. Timestamps are ISO 8601 strings;
// repositories convert to and from Firestore types at the boundary.

// Enum-like values are `as const` arrays so the catalog (P1-07) and tests can
// validate data against the same list the union types come from.

export const WEIGHT_UNITS = ["kg", "lb"] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

// Approved under decision D7 on 2026-10-16.
export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "full-body",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

// Approved under decision D7 on 2026-10-16.
export const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "kettlebell",
  "cable",
  "machine",
  "bodyweight",
  "band",
  "other",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const MECHANICS = ["compound", "isolation"] as const;
export type Mechanic = (typeof MECHANICS)[number];

export const DISTANCE_UNITS = ["km", "mi"] as const;
export type DistanceUnit = (typeof DISTANCE_UNITS)[number];

/**
 * What a cardio set can record besides its time (2026-11-02). Each cardio
 * exercise lists the ones its machine shows, in display order.
 */
export const CARDIO_FIELDS = ["distance", "level", "floors", "inclinePct", "calories"] as const;
export type CardioField = (typeof CARDIO_FIELDS)[number];

// Bump when the stored WorkoutLog shape changes so old documents can be
// migrated on read. 2 (2026-11-02): sets may be cardio sets, and totals
// have cardioSec. Version 1 documents are still read.
export const WORKOUT_LOG_SCHEMA_VERSION = 2;

export type Exercise = {
  /** Stable kebab-case slug, e.g. "barbell-back-squat". */
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: readonly MuscleGroup[];
  equipment: Equipment;
  mechanic: Mechanic;
  /** Other names search should find it by, e.g. "StairMaster". */
  aliases?: readonly string[];
  /** Set on cardio exercises: logged by time, not weight × reps. */
  cardio?: { fields: readonly CardioField[] };
};

export type RoutineExercise = {
  exerciseId: string;
  targetSets: number;
  /** Free-form rep target, e.g. "8" or "8–12". */
  targetReps?: string;
  /** Unused until the rest timer ships. */
  restSec?: number;
};

export type Routine = {
  id: string;
  name: string;
  notes?: string;
  /** Display order is array order. */
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
};

export type StrengthSet = {
  reps: number;
  /** Stored as entered, in `unit`; analytics convert. */
  weight: number;
  unit: WeightUnit;
  done: boolean;
};

/** A stretch on a cardio machine. Only the time is required. */
export type CardioSet = {
  durationSec: number;
  distance?: number;
  /** Present whenever `distance` is. */
  distanceUnit?: DistanceUnit;
  level?: number;
  floors?: number;
  inclinePct?: number;
  calories?: number;
  done: boolean;
};

export type LoggedSet = StrengthSet | CardioSet;

export function isCardioSet(set: LoggedSet): set is CardioSet {
  return "durationSec" in set;
}

export type LoggedExercise = {
  exerciseId: string;
  /** Snapshot so history stays readable if the catalog changes. */
  exerciseName: string;
  note?: string;
  sets: LoggedSet[];
};

export type WorkoutTotals = {
  sets: number;
  reps: number;
  volume: number;
  /** Unit `volume` is expressed in. */
  unit: WeightUnit;
  /** Time on cardio sets; 0 in version 1 workouts. */
  cardioSec: number;
};

export type WorkoutLog = {
  /**
   * Generated on the device (crypto.randomUUID()) and reused as the Firestore
   * document id, so a save retried after going offline can't duplicate.
   */
  id: string;
  schemaVersion: typeof WORKOUT_LOG_SCHEMA_VERSION;
  routineId?: string;
  /** Snapshot of the routine's name when the workout started. */
  routineName?: string;
  startedAt: string;
  endedAt: string;
  updatedAt: string;
  exercises: LoggedExercise[];
  /** Denormalized for "last time" lookups (array-contains queries). */
  exerciseIds: string[];
  totals: WorkoutTotals;
};
