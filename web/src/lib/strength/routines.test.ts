import { describe, expect, it } from "vitest";

import {
  PRESET_ROUTINES,
  addRoutineExercise,
  cleanRoutine,
  copyRoutine,
  isPresetRoutine,
  moveRoutineExercise,
  newRoutine,
  removeRoutineExercise,
  routineFromWorkout,
  routineProblems,
  updateRoutineDetails,
  updateRoutineExercise,
  type Routine,
  type WorkoutLog,
} from "@/lib/strength";

const T0 = "2026-10-18T10:00:00.000Z";
const T1 = "2026-10-18T10:05:00.000Z";

const log: WorkoutLog = {
  id: "w1",
  schemaVersion: 1,
  startedAt: T0,
  endedAt: T1,
  updatedAt: T1,
  exercises: [
    {
      exerciseId: "barbell-row",
      exerciseName: "Barbell row",
      sets: [
        { reps: 8, weight: 135, unit: "lb", done: true },
        { reps: 6, weight: 135, unit: "lb", done: true },
      ],
    },
    {
      exerciseId: "hammer-curl",
      exerciseName: "Hammer curl",
      sets: [{ reps: 12, weight: 30, unit: "lb", done: true }],
    },
  ],
  exerciseIds: ["barbell-row", "hammer-curl"],
  totals: { sets: 3, reps: 26, volume: 2250, unit: "lb" },
};

const valid: Routine = {
  id: "r1",
  name: "Back",
  exercises: [{ exerciseId: "barbell-row", targetSets: 3, targetReps: "8" }],
  createdAt: T0,
  updatedAt: T0,
};

describe("routines", () => {
  it("tells presets from the user's own routines", () => {
    expect(isPresetRoutine(PRESET_ROUTINES[0])).toBe(true);
    expect(isPresetRoutine(valid)).toBe(false);
  });

  it("builds a routine from a finished workout", () => {
    const routine = routineFromWorkout(log, { id: "r2", now: T1, name: "My pull" });
    expect(routine).toEqual({
      id: "r2",
      name: "My pull",
      exercises: [
        { exerciseId: "barbell-row", targetSets: 2, targetReps: "6–8" },
        { exerciseId: "hammer-curl", targetSets: 1, targetReps: "12" },
      ],
      createdAt: T1,
      updatedAt: T1,
    });
    expect(routineProblems(routine)).toEqual([]);
  });

  it("copies a preset under a new id without sharing arrays", () => {
    const copy = copyRoutine(PRESET_ROUTINES[0], { id: "r3", now: T1 });
    expect(copy.id).toBe("r3");
    expect(copy.name).toBe("Push day");
    expect(copy.exercises).toEqual(PRESET_ROUTINES[0].exercises);
    expect(copy.exercises[0]).not.toBe(PRESET_ROUTINES[0].exercises[0]);
    expect(isPresetRoutine(copy)).toBe(false);
  });

  it("edits exercises without mutating the input", () => {
    let routine = newRoutine({ id: "r4", now: T0 });
    routine = addRoutineExercise(routine, "barbell-row", T1);
    routine = addRoutineExercise(routine, "hammer-curl", T1);
    routine = moveRoutineExercise(routine, 1, 0, T1);
    expect(routine.exercises.map((e) => e.exerciseId)).toEqual(["hammer-curl", "barbell-row"]);

    const edited = updateRoutineExercise(routine, 0, { targetSets: 5, targetReps: "", restSec: 120 }, T1);
    expect(edited.exercises[0]).toEqual({ exerciseId: "hammer-curl", targetSets: 5, restSec: 120 });
    expect(routine.exercises[0].targetSets).toBe(3);

    const noRest = updateRoutineExercise(edited, 0, { restSec: null }, T1);
    expect("restSec" in noRest.exercises[0]).toBe(false);

    expect(removeRoutineExercise(noRest, 0, T1).exercises).toHaveLength(1);
    expect(() => removeRoutineExercise(noRest, 5, T1)).toThrow(RangeError);
    expect(() => addRoutineExercise(noRest, "not-real", T1)).toThrow(RangeError);
  });

  it("sets and clears details", () => {
    const named = updateRoutineDetails(valid, { name: "Upper", notes: "Heavy" }, T1);
    expect(named).toMatchObject({ name: "Upper", notes: "Heavy", updatedAt: T1 });
    expect("notes" in updateRoutineDetails(named, { notes: "  " }, T1)).toBe(false);
  });

  it("reports what blocks saving", () => {
    expect(routineProblems(valid)).toEqual([]);
    expect(routineProblems(newRoutine({ id: "x", now: T0 }))).toEqual([
      "Give the routine a name.",
      "Add at least one exercise.",
    ]);
    expect(
      routineProblems({
        ...valid,
        exercises: [{ exerciseId: "barbell-row", targetSets: 11, restSec: 601 }],
      })
    ).toHaveLength(2);
    expect(routineProblems({ ...valid, name: "x".repeat(61) })).toHaveLength(1);
  });

  it("trims before saving", () => {
    expect(cleanRoutine({ ...valid, name: " Back ", notes: " " })).toEqual(valid);
  });
});
