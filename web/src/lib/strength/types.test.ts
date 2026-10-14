import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, expectTypeOf, it } from "vitest";

import {
  EQUIPMENT,
  MECHANICS,
  MUSCLE_GROUPS,
  WEIGHT_UNITS,
  WORKOUT_LOG_SCHEMA_VERSION,
  type Equipment,
  type Exercise,
  type LoggedSet,
  type MuscleGroup,
  type Routine,
  type RoutineExercise,
  type WeightUnit,
  type WorkoutLog,
} from "@/lib/strength";

// Type-level assertions are checked by `npm run typecheck`; the runtime
// assertions below run under `npm test`.

const fullLog: WorkoutLog = {
  id: "3f1c9a52-6a0e-4b8e-9d55-2f6f3c1d7e10",
  schemaVersion: WORKOUT_LOG_SCHEMA_VERSION,
  routineId: "push-day",
  routineName: "Push day",
  startedAt: "2026-10-13T17:00:00.000Z",
  endedAt: "2026-10-13T18:05:00.000Z",
  updatedAt: "2026-10-13T18:05:00.000Z",
  exercises: [
    {
      exerciseId: "barbell-bench-press",
      exerciseName: "Barbell bench press",
      note: "Paused first rep",
      sets: [
        { reps: 5, weight: 100, unit: "kg", done: true },
        { reps: 5, weight: 225, unit: "lb", done: false },
      ],
    },
  ],
  exerciseIds: ["barbell-bench-press"],
  totals: { sets: 1, reps: 5, volume: 500, unit: "kg" },
};

describe("enum-like value lists", () => {
  it.each([
    ["WEIGHT_UNITS", WEIGHT_UNITS],
    ["MUSCLE_GROUPS", MUSCLE_GROUPS],
    ["EQUIPMENT", EQUIPMENT],
    ["MECHANICS", MECHANICS],
  ])("%s has unique, kebab-case values", (_name, values) => {
    expect(new Set(values).size).toBe(values.length);
    for (const value of values) {
      expect(value).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it("derives union types from the lists", () => {
    expectTypeOf<WeightUnit>().toEqualTypeOf<"kg" | "lb">();
    expectTypeOf<MuscleGroup>().toEqualTypeOf<(typeof MUSCLE_GROUPS)[number]>();
    expectTypeOf<Equipment>().toEqualTypeOf<(typeof EQUIPMENT)[number]>();
  });
});

describe("domain types", () => {
  it("accepts a fully populated workout log", () => {
    expectTypeOf(fullLog).toEqualTypeOf<WorkoutLog>();
    expect(fullLog.schemaVersion).toBe(1);
  });

  it("keeps optional fields optional", () => {
    const minimalRoutineExercise: RoutineExercise = {
      exerciseId: "pull-up",
      targetSets: 3,
    };
    const minimalRoutine: Routine = {
      id: "r1",
      name: "Pull day",
      exercises: [minimalRoutineExercise],
      createdAt: "2026-10-13T00:00:00.000Z",
      updatedAt: "2026-10-13T00:00:00.000Z",
    };

    expectTypeOf<RoutineExercise["targetReps"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<WorkoutLog["routineId"]>().toEqualTypeOf<string | undefined>();
    expect(minimalRoutine.exercises).toHaveLength(1);
  });

  it("requires a device-generated id and schema version on every log", () => {
    expectTypeOf<WorkoutLog["id"]>().toEqualTypeOf<string>();
    expectTypeOf<WorkoutLog["schemaVersion"]>().toEqualTypeOf<1>();
  });

  it("rejects values outside the enums", () => {
    // @ts-expect-error — "stone" is not a WeightUnit.
    const badSet: LoggedSet = { reps: 5, weight: 10, unit: "stone", done: true };
    const badExercise: Exercise = {
      id: "neck-curl",
      name: "Neck curl",
      // @ts-expect-error — "neck" is not a MuscleGroup.
      primaryMuscle: "neck",
      secondaryMuscles: [],
      equipment: "other",
      mechanic: "isolation",
    };
    expect([badSet, badExercise]).toHaveLength(2);
  });
});

describe("module boundary", () => {
  // Phase 0 rule: domain code stays pure so it runs in tests, the browser and
  // the future server-side agent alike.
  const dir = fileURLToPath(new URL(".", import.meta.url));
  const sources = readdirSync(dir).filter(
    (file) => file.endsWith(".ts") && !file.endsWith(".test.ts")
  );

  it.each(sources)("%s imports no Firebase, React or Next.js", (file) => {
    const source = readFileSync(`${dir}${file}`, "utf8");
    expect(source).not.toMatch(/from\s+["'](firebase|@firebase|react|next)(\/|["'])/);
  });
});
