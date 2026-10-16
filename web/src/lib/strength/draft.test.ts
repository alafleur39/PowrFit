import { describe, expect, it } from "vitest";

import {
  PRESET_ROUTINES,
  addExercise,
  addSet,
  canCompleteSet,
  createDraft,
  draftSetCounts,
  draftTotals,
  finishDraft,
  removeExercise,
  removeSet,
  setDraftUnit,
  toggleSetDone,
  updateSet,
  workoutTotals,
  type WorkoutDraft,
} from "@/lib/strength";

const T0 = "2026-10-16T17:00:00.000Z";
const T1 = "2026-10-16T17:05:00.000Z";
const T2 = "2026-10-16T18:00:00.000Z";
const pullDay = PRESET_ROUTINES.find((routine) => routine.id === "preset-pull-day")!;

function emptyDraft(): WorkoutDraft {
  return createDraft({ id: "w1", now: T0, unit: "lb" });
}

/** Fills set `index` of exercise `key` and marks it done. */
function logSet(draft: WorkoutDraft, key: string, index: number, weight: number, reps: number) {
  const filled = updateSet(draft, key, index, { weight, reps }, T1);
  return toggleSetDone(filled, key, index, T1);
}

describe("createDraft", () => {
  it("starts empty", () => {
    expect(emptyDraft()).toEqual({
      id: "w1",
      startedAt: T0,
      updatedAt: T0,
      unit: "lb",
      exercises: [],
      nextKey: 0,
    });
  });

  it("copies a routine's exercises with empty target sets", () => {
    const draft = createDraft({ id: "w1", now: T0, unit: "kg", routine: pullDay });
    expect(draft.routineId).toBe("preset-pull-day");
    expect(draft.routineName).toBe("Pull day");
    expect(draft.exercises.map((exercise) => exercise.exerciseId)).toEqual(
      pullDay.exercises.map((exercise) => exercise.exerciseId)
    );
    expect(draft.exercises[0]).toMatchObject({
      key: "e0",
      exerciseName: "Barbell row",
      targetReps: "6",
    });
    expect(draft.exercises[0].sets).toHaveLength(4);
    expect(draft.exercises[0].sets[0]).toEqual({ reps: null, weight: null, unit: "kg", done: false });
    expect(draft.nextKey).toBe(pullDay.exercises.length);
  });
});

describe("editing", () => {
  it("adds exercises with unique keys, even the same exercise twice", () => {
    let draft = addExercise(emptyDraft(), "pull-up", T1);
    draft = addExercise(draft, "pull-up", T1);
    expect(draft.exercises.map((exercise) => exercise.key)).toEqual(["e0", "e1"]);
    expect(draft.exercises[0].sets).toHaveLength(1);
    expect(draft.updatedAt).toBe(T1);
  });

  it("rejects an unknown exercise", () => {
    expect(() => addExercise(emptyDraft(), "zercher-squat", T1)).toThrow(RangeError);
  });

  it("removes an exercise without reusing its key", () => {
    let draft = addExercise(emptyDraft(), "pull-up", T1);
    draft = removeExercise(draft, "e0", T1);
    draft = addExercise(draft, "dip", T1);
    expect(draft.exercises.map((exercise) => exercise.key)).toEqual(["e1"]);
  });

  it("adds a set that copies the previous one, not done", () => {
    let draft = addExercise(emptyDraft(), "barbell-curl", T1);
    draft = logSet(draft, "e0", 0, 65, 10);
    draft = addSet(draft, "e0", T2);
    expect(draft.exercises[0].sets[1]).toEqual({ reps: 10, weight: 65, unit: "lb", done: false });
  });

  it("removes a set by index", () => {
    let draft = addExercise(emptyDraft(), "barbell-curl", T1);
    draft = addSet(draft, "e0", T1);
    draft = updateSet(draft, "e0", 1, { reps: 5 }, T1);
    draft = removeSet(draft, "e0", 0, T1);
    expect(draft.exercises[0].sets).toEqual([{ reps: 5, weight: null, unit: "lb", done: false }]);
  });

  it("rejects invalid weight, reps and set indexes", () => {
    const draft = addExercise(emptyDraft(), "barbell-curl", T1);
    expect(() => updateSet(draft, "e0", 0, { weight: -5 }, T1)).toThrow(RangeError);
    expect(() => updateSet(draft, "e0", 0, { weight: Number.NaN }, T1)).toThrow(RangeError);
    expect(() => updateSet(draft, "e0", 0, { reps: 2.5 }, T1)).toThrow(RangeError);
    expect(() => updateSet(draft, "e0", 3, { reps: 5 }, T1)).toThrow(RangeError);
    expect(() => updateSet(draft, "nope", 0, { reps: 5 }, T1)).toThrow(RangeError);
  });

  it("never mutates its input", () => {
    const before = addExercise(emptyDraft(), "barbell-curl", T1);
    const snapshot = structuredClone(before);
    logSet(before, "e0", 0, 50, 8);
    addSet(before, "e0", T2);
    removeExercise(before, "e0", T2);
    expect(before).toEqual(snapshot);
  });
});

describe("completing sets", () => {
  it("needs a weight and at least one rep", () => {
    expect(canCompleteSet({ reps: 5, weight: 0, unit: "kg", done: false })).toBe(true);
    expect(canCompleteSet({ reps: 0, weight: 50, unit: "kg", done: false })).toBe(false);
    expect(canCompleteSet({ reps: 5, weight: null, unit: "kg", done: false })).toBe(false);
    expect(canCompleteSet({ reps: null, weight: 50, unit: "kg", done: false })).toBe(false);
  });

  it("ignores a tick on an incomplete set", () => {
    const draft = addExercise(emptyDraft(), "barbell-curl", T1);
    expect(toggleSetDone(draft, "e0", 0, T2)).toBe(draft);
  });

  it("toggles done on and off", () => {
    let draft = addExercise(emptyDraft(), "barbell-curl", T1);
    draft = logSet(draft, "e0", 0, 50, 8);
    expect(draft.exercises[0].sets[0].done).toBe(true);
    draft = toggleSetDone(draft, "e0", 0, T2);
    expect(draft.exercises[0].sets[0].done).toBe(false);
  });

  it("unmarks a done set whose reps are cleared", () => {
    let draft = addExercise(emptyDraft(), "barbell-curl", T1);
    draft = logSet(draft, "e0", 0, 50, 8);
    draft = updateSet(draft, "e0", 0, { reps: null }, T2);
    expect(draft.exercises[0].sets[0].done).toBe(false);
  });

  it("counts done and not-done sets", () => {
    let draft = createDraft({ id: "w1", now: T0, unit: "lb", routine: pullDay });
    draft = logSet(draft, "e0", 0, 135, 6);
    const total = pullDay.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0);
    expect(draftSetCounts(draft)).toEqual({ done: 1, notDone: total - 1 });
  });
});

describe("units", () => {
  it("uses the new unit only for sets added afterwards", () => {
    let draft = addExercise(emptyDraft(), "barbell-curl", T1);
    draft = setDraftUnit(draft, "kg", T1);
    draft = addExercise(draft, "hammer-curl", T1);
    expect(draft.exercises[0].sets[0].unit).toBe("lb");
    expect(draft.exercises[1].sets[0].unit).toBe("kg");
  });
});

describe("finishDraft", () => {
  it("keeps only done sets and drops empty exercises", () => {
    let draft = createDraft({ id: "w1", now: T0, unit: "lb", routine: pullDay });
    draft = logSet(draft, "e0", 0, 135, 6);
    draft = logSet(draft, "e0", 1, 135, 6);
    draft = updateSet(draft, "e0", 2, { weight: 135, reps: 5 }, T1); // filled, not done
    draft = logSet(draft, "e1", 0, 120, 10);

    const log = finishDraft(draft, T2);
    expect(log).toMatchObject({
      id: "w1",
      schemaVersion: 1,
      routineId: "preset-pull-day",
      routineName: "Pull day",
      startedAt: T0,
      endedAt: T2,
      updatedAt: T2,
      exerciseIds: ["barbell-row", "lat-pulldown"],
    });
    expect(log.exercises.map((exercise) => exercise.sets.length)).toEqual([2, 1]);
    expect(log.exercises.every((exercise) => exercise.sets.every((set) => set.done))).toBe(true);
    expect(log.totals).toEqual(workoutTotals(log.exercises, "lb"));
    expect(log.totals).toEqual({ sets: 3, reps: 22, volume: 2820, unit: "lb" });
  });

  it("lists a repeated exercise id once", () => {
    let draft = addExercise(emptyDraft(), "pull-up", T1);
    draft = addExercise(draft, "pull-up", T1);
    draft = logSet(draft, "e0", 0, 0, 10);
    draft = logSet(draft, "e1", 0, 0, 8);
    expect(finishDraft(draft, T2).exerciseIds).toEqual(["pull-up"]);
  });

  it("omits routine fields for an empty workout", () => {
    let draft = addExercise(emptyDraft(), "pull-up", T1);
    draft = logSet(draft, "e0", 0, 0, 10);
    const log = finishDraft(draft, T2);
    expect("routineId" in log).toBe(false);
    expect("routineName" in log).toBe(false);
  });

  it("refuses a workout with no done sets", () => {
    const draft = addExercise(emptyDraft(), "pull-up", T1);
    expect(() => finishDraft(draft, T2)).toThrow(RangeError);
  });

  it("is repeatable: the same draft always gives the same log", () => {
    let draft = addExercise(emptyDraft(), "pull-up", T1);
    draft = logSet(draft, "e0", 0, 0, 10);
    expect(finishDraft(draft, T2)).toEqual(finishDraft(draft, T2));
  });

  it("matches the live totals shown during the workout", () => {
    let draft = addExercise(emptyDraft(), "barbell-curl", T1);
    draft = logSet(draft, "e0", 0, 60, 10);
    draft = setDraftUnit(draft, "kg", T1);
    draft = addSet(draft, "e0", T1);
    draft = toggleSetDone(draft, "e0", 1, T1);
    expect(finishDraft(draft, T2).totals).toEqual(draftTotals(draft, "kg"));
  });
});
