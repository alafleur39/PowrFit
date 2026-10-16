import { describe, expect, it } from "vitest";

import { EXERCISES, PRESET_ROUTINES } from "@/lib/strength";

const catalogIds = new Set(EXERCISES.map((exercise) => exercise.id));

describe("PRESET_ROUTINES", () => {
  it("offers push, pull and leg days", () => {
    expect(PRESET_ROUTINES.map((routine) => routine.name)).toEqual([
      "Push day",
      "Pull day",
      "Leg day",
    ]);
  });

  it("has unique ids, all prefixed so they can't clash with user routines", () => {
    const ids = PRESET_ROUTINES.map((routine) => routine.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^preset-[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(PRESET_ROUTINES.map((routine) => [routine.name, routine] as const))(
    "%s uses only catalog exercises, each once",
    (_name, routine) => {
      const ids = routine.exercises.map((exercise) => exercise.exerciseId);
      for (const id of ids) expect(catalogIds, id).toContain(id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBeGreaterThanOrEqual(5);
    }
  );

  it("has whole-number set targets and rep targets like 10 or 8–12", () => {
    for (const routine of PRESET_ROUTINES) {
      for (const { exerciseId, targetSets, targetReps } of routine.exercises) {
        expect(Number.isInteger(targetSets) && targetSets > 0, exerciseId).toBe(true);

        const match = /^(\d+)(?:–(\d+))?$/.exec(targetReps ?? "");
        expect(match, `${exerciseId}: ${targetReps}`).not.toBeNull();
        const [, low, high] = match!;
        expect(Number(low)).toBeGreaterThan(0);
        if (high) expect(Number(high)).toBeGreaterThan(Number(low));
      }
    }
  });

  it("matches the approved Pull and Leg day targets", () => {
    const targets = (id: string) =>
      PRESET_ROUTINES.find((routine) => routine.id === id)!.exercises.map(
        (exercise) => `${exercise.exerciseId} ${exercise.targetSets}×${exercise.targetReps}`
      );

    expect(targets("preset-pull-day")).toEqual([
      "barbell-row 4×6",
      "lat-pulldown 4×10",
      "one-arm-dumbbell-row 3×12",
      "reverse-fly-machine 3×12",
      "machine-preacher-curl 4×12",
      "hammer-curl 3×15",
    ]);
    expect(targets("preset-leg-day")).toEqual([
      "barbell-back-squat 3×10",
      "romanian-deadlift 3×8–12",
      "bulgarian-split-squat 3×10–15",
      "lying-leg-curl 3×10",
      "leg-extension 3×10",
      "dumbbell-calf-raise 3×10–15",
    ]);
  });
});
