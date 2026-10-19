import { describe, expect, it } from "vitest";

import {
  cleanEditedLog,
  editLogSet,
  logProblems,
  removeLogExercise,
  removeLogSet,
  type WorkoutLog,
} from "@/lib/strength";

const T0 = "2026-10-19T10:00:00.000Z";
const T1 = "2026-10-19T11:00:00.000Z";
const T2 = "2026-10-20T09:00:00.000Z";

const log: WorkoutLog = {
  id: "w1",
  schemaVersion: 1,
  routineName: "Pull day",
  startedAt: T0,
  endedAt: T1,
  updatedAt: T1,
  exercises: [
    {
      exerciseId: "barbell-row",
      exerciseName: "Barbell row",
      sets: [
        { reps: 8, weight: 135, unit: "lb", done: true },
        { reps: 6, weight: 155, unit: "lb", done: true },
      ],
    },
    {
      exerciseId: "hammer-curl",
      exerciseName: "Hammer curl",
      sets: [{ reps: 10, weight: 15, unit: "kg", done: true }],
    },
  ],
  exerciseIds: ["barbell-row", "hammer-curl"],
  totals: { sets: 3, reps: 24, volume: 2338.7, unit: "lb" },
};

describe("editing a finished workout", () => {
  it("changes one set's weight and reps and keeps start and end times", () => {
    const edited = editLogSet(log, 0, 1, { weight: 165, reps: 5 }, T2);
    expect(edited.exercises[0].sets[1]).toEqual({ reps: 5, weight: 165, unit: "lb", done: true });
    expect(edited.exercises[0].sets[0]).toBe(log.exercises[0].sets[0]);
    expect(edited.exercises[1]).toBe(log.exercises[1]);
    expect(edited).toMatchObject({ startedAt: T0, endedAt: T1, updatedAt: T2 });
    expect(log.exercises[0].sets[1].weight).toBe(155);
  });

  it("removes a set and an exercise", () => {
    const fewerSets = removeLogSet(log, 0, 0, T2);
    expect(fewerSets.exercises[0].sets).toEqual([log.exercises[0].sets[1]]);
    const fewerExercises = removeLogExercise(log, 1, T2);
    expect(fewerExercises.exercises.map((e) => e.exerciseId)).toEqual(["barbell-row"]);
    expect(fewerExercises.updatedAt).toBe(T2);
  });

  it("rejects out-of-range indexes", () => {
    expect(() => editLogSet(log, 5, 0, { reps: 1 }, T2)).toThrow(RangeError);
    expect(() => removeLogSet(log, 0, 9, T2)).toThrow(RangeError);
    expect(() => removeLogExercise(log, -1, T2)).toThrow(RangeError);
  });

  it("recomputes ids and totals in the saved unit and drops empty exercises", () => {
    const emptied = removeLogSet(log, 1, 0, T2);
    expect(emptied.exercises).toHaveLength(2);
    const cleaned = cleanEditedLog(emptied);
    expect(cleaned.exercises.map((e) => e.exerciseId)).toEqual(["barbell-row"]);
    expect(cleaned.exerciseIds).toEqual(["barbell-row"]);
    expect(cleaned.totals).toEqual({ sets: 2, reps: 14, volume: 2010, unit: "lb" });
  });

  it("says what's wrong before saving", () => {
    expect(logProblems(log)).toEqual([]);
    const noSets = removeLogExercise(removeLogExercise(log, 1, T2), 0, T2);
    expect(logProblems(noSets)).toEqual(["Keep at least one set, or delete the workout instead."]);
    expect(logProblems(editLogSet(log, 0, 0, { reps: 0 }, T2))).toEqual([
      "Every set needs at least 1 rep.",
    ]);
    expect(logProblems(editLogSet(log, 0, 0, { weight: Number.NaN }, T2))).toEqual([
      "Weights can't be negative or empty.",
    ]);
  });
});
