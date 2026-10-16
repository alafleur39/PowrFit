import { describe, expect, it } from "vitest";

import {
  exerciseTotals,
  setVolume,
  workoutTotals,
  type LoggedExercise,
  type LoggedSet,
} from "@/lib/strength";

function exercise(exerciseId: string, sets: LoggedSet[]): LoggedExercise {
  return { exerciseId, exerciseName: exerciseId, sets };
}

const bench = exercise("barbell-bench-press", [
  { reps: 6, weight: 135, unit: "lb", done: true },
  { reps: 6, weight: 135, unit: "lb", done: true },
  { reps: 5, weight: 135, unit: "lb", done: false },
]);

const squat = exercise("barbell-back-squat", [
  { reps: 5, weight: 100, unit: "kg", done: true },
  { reps: 5, weight: 100, unit: "kg", done: true },
]);

describe("setVolume", () => {
  it("is weight × reps in the set's own unit", () => {
    expect(setVolume({ reps: 8, weight: 40, unit: "lb", done: true }, "lb")).toBe(320);
  });

  it("converts to the target unit without rounding", () => {
    const set: LoggedSet = { reps: 1, weight: 1, unit: "lb", done: true };
    expect(setVolume(set, "kg")).toBe(0.45359237);
  });

  it("is zero for zero reps or zero weight", () => {
    expect(setVolume({ reps: 0, weight: 100, unit: "kg", done: true }, "kg")).toBe(0);
    expect(setVolume({ reps: 10, weight: 0, unit: "kg", done: true }, "kg")).toBe(0);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("rejects %d reps", (reps) => {
    expect(() => setVolume({ reps, weight: 10, unit: "kg", done: true }, "kg")).toThrow(
      RangeError
    );
  });

  it("rejects an invalid weight", () => {
    expect(() => setVolume({ reps: 5, weight: -10, unit: "kg", done: true }, "kg")).toThrow(
      RangeError
    );
  });
});

describe("exerciseTotals", () => {
  it("counts only done sets", () => {
    expect(exerciseTotals(bench, "lb")).toEqual({
      sets: 2,
      reps: 12,
      volume: 1620,
      unit: "lb",
    });
  });

  it("returns zeros when no set is done", () => {
    const skipped = exercise("lateral-raise", [
      { reps: 8, weight: 15, unit: "lb", done: false },
    ]);
    expect(exerciseTotals(skipped, "kg")).toEqual({ sets: 0, reps: 0, volume: 0, unit: "kg" });
  });
});

describe("workoutTotals", () => {
  it("returns zeros for an empty workout", () => {
    expect(workoutTotals([], "kg")).toEqual({ sets: 0, reps: 0, volume: 0, unit: "kg" });
  });

  it("totals a mixed kg/lb workout in kg", () => {
    // 1620 lb × 0.45359237 = 734.8196... kg, plus 1000 kg.
    expect(workoutTotals([bench, squat], "kg")).toEqual({
      sets: 4,
      reps: 22,
      volume: 1734.8,
      unit: "kg",
    });
  });

  it("totals a mixed kg/lb workout in lb", () => {
    // 1000 kg ÷ 0.45359237 = 2204.6226... lb, plus 1620 lb.
    expect(workoutTotals([bench, squat], "lb")).toEqual({
      sets: 4,
      reps: 22,
      volume: 3824.6,
      unit: "lb",
    });
  });

  it("rounds once at the end, not per set", () => {
    // Each set is 0.45359237 kg; rounding per set would give 10 × 0.5 = 5.
    const curls = exercise(
      "cable-curl",
      Array.from({ length: 10 }, (): LoggedSet => ({ reps: 1, weight: 1, unit: "lb", done: true }))
    );
    expect(workoutTotals([curls], "kg").volume).toBe(4.5);
  });

  it("counts reps but no volume for unweighted bodyweight sets (D6)", () => {
    const pullUps = exercise("pull-up", [
      { reps: 10, weight: 0, unit: "kg", done: true },
      { reps: 8, weight: 0, unit: "kg", done: true },
    ]);
    expect(workoutTotals([pullUps, squat], "kg")).toEqual({
      sets: 4,
      reps: 28,
      volume: 1000,
      unit: "kg",
    });
  });

  it("matches the sum of its exercises", () => {
    const whole = workoutTotals([bench, squat], "lb");
    const parts = [exerciseTotals(bench, "lb"), exerciseTotals(squat, "lb")];
    expect(whole.sets).toBe(parts[0].sets + parts[1].sets);
    expect(whole.reps).toBe(parts[0].reps + parts[1].reps);
    expect(whole.volume).toBeCloseTo(parts[0].volume + parts[1].volume, 0);
  });

  it("does not modify its input", () => {
    const before = structuredClone([bench, squat]);
    workoutTotals([bench, squat], "kg");
    expect([bench, squat]).toEqual(before);
  });
});
