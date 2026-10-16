import { describe, expect, it } from "vitest";

import {
  WORKOUT_LOG_SCHEMA_VERSION,
  lastSetsForExercise,
  type LoggedExercise,
  type WorkoutLog,
} from "@/lib/strength";

function log(id: string, startedAt: string, exercises: LoggedExercise[]): WorkoutLog {
  return {
    id,
    schemaVersion: WORKOUT_LOG_SCHEMA_VERSION,
    startedAt,
    endedAt: startedAt,
    updatedAt: startedAt,
    exercises,
    exerciseIds: exercises.map((exercise) => exercise.exerciseId),
    totals: { sets: 0, reps: 0, volume: 0, unit: "kg" },
  };
}

function bench(weight: number, done = true): LoggedExercise {
  return {
    exerciseId: "barbell-bench-press",
    exerciseName: "Barbell bench press",
    sets: [
      { reps: 6, weight, unit: "lb", done },
      { reps: 5, weight, unit: "lb", done },
    ],
  };
}

const squat: LoggedExercise = {
  exerciseId: "barbell-back-squat",
  exerciseName: "Barbell back squat",
  sets: [{ reps: 5, weight: 100, unit: "kg", done: true }],
};

const oldest = log("a", "2026-09-01T10:00:00.000Z", [bench(115)]);
const middle = log("b", "2026-09-15T10:00:00.000Z", [bench(125), squat]);
const newest = log("c", "2026-10-01T10:00:00.000Z", [bench(135)]);

describe("lastSetsForExercise", () => {
  it("returns the newest of three logs", () => {
    const result = lastSetsForExercise([oldest, middle, newest], "barbell-bench-press");
    expect(result).toEqual({
      logId: "c",
      startedAt: "2026-10-01T10:00:00.000Z",
      sets: bench(135).sets,
    });
  });

  it("does not depend on input order", () => {
    for (const logs of [
      [newest, oldest, middle],
      [middle, newest, oldest],
      [oldest, middle, newest].reverse(),
    ]) {
      expect(lastSetsForExercise(logs, "barbell-bench-press")?.logId).toBe("c");
    }
  });

  it("compares real times, not strings", () => {
    // 09:00 at UTC-5 is 14:00Z, later than 12:00Z.
    const offset = log("offset", "2026-10-01T09:00:00-05:00", [bench(145)]);
    expect(lastSetsForExercise([newest, offset], "barbell-bench-press")?.logId).toBe("offset");
  });

  it("returns null when the exercise was never logged", () => {
    expect(lastSetsForExercise([oldest, middle, newest], "pull-up")).toBeNull();
    expect(lastSetsForExercise([], "barbell-bench-press")).toBeNull();
  });

  it("falls back to an older log when the newest has no done sets", () => {
    const skipped = log("d", "2026-10-10T10:00:00.000Z", [bench(155, false)]);
    const result = lastSetsForExercise([oldest, skipped, middle], "barbell-bench-press");
    expect(result?.logId).toBe("b");
  });

  it("returns only done sets", () => {
    const partial = log("e", "2026-10-12T10:00:00.000Z", [
      {
        ...bench(135),
        sets: [
          { reps: 6, weight: 135, unit: "lb", done: true },
          { reps: 4, weight: 135, unit: "lb", done: false },
        ],
      },
    ]);
    expect(lastSetsForExercise([partial], "barbell-bench-press")?.sets).toEqual([
      { reps: 6, weight: 135, unit: "lb", done: true },
    ]);
  });

  it("joins an exercise logged twice in one workout", () => {
    const twice = log("f", "2026-10-13T10:00:00.000Z", [bench(135), squat, bench(95)]);
    const sets = lastSetsForExercise([twice], "barbell-bench-press")?.sets;
    expect(sets?.map((set) => set.weight)).toEqual([135, 135, 95, 95]);
  });

  it("treats an unparseable date as oldest", () => {
    const broken = log("g", "not a date", [bench(185)]);
    expect(lastSetsForExercise([broken, oldest], "barbell-bench-press")?.logId).toBe("a");
    expect(lastSetsForExercise([oldest, broken], "barbell-bench-press")?.logId).toBe("a");
    expect(lastSetsForExercise([broken], "barbell-bench-press")?.logId).toBe("g");
  });

  it("leaves the input unchanged and returns copies", () => {
    const logs = [oldest, middle, newest];
    const before = structuredClone(logs);
    const result = lastSetsForExercise(logs, "barbell-bench-press");
    expect(logs).toEqual(before);

    result!.sets[0].weight = 999;
    expect(newest.exercises[0].sets[0].weight).toBe(135);
  });
});
