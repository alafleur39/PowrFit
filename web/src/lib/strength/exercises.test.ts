import { describe, expect, it } from "vitest";

import {
  EQUIPMENT,
  EXERCISES,
  MECHANICS,
  MUSCLE_GROUPS,
  searchExercises,
} from "@/lib/strength";

const names = (list: { name: string }[]) => list.map((exercise) => exercise.name);

describe("EXERCISES catalog", () => {
  it("has the 52 exercises approved under D7, plus 2 added for presets", () => {
    expect(EXERCISES).toHaveLength(54);
  });

  it("has unique, kebab-case ids", () => {
    const ids = EXERCISES.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("derives each id from its name", () => {
    for (const exercise of EXERCISES) {
      const slug = exercise.name
        .toLowerCase()
        .replace(/'/g, "")
        .replace(/[^a-z0-9]+/g, "-");
      expect(exercise.id).toBe(slug);
    }
  });

  it("has unique names", () => {
    const lower = EXERCISES.map((exercise) => exercise.name.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });

  it("uses only enum values", () => {
    for (const exercise of EXERCISES) {
      expect(MUSCLE_GROUPS).toContain(exercise.primaryMuscle);
      for (const muscle of exercise.secondaryMuscles) expect(MUSCLE_GROUPS).toContain(muscle);
      expect(EQUIPMENT).toContain(exercise.equipment);
      expect(MECHANICS).toContain(exercise.mechanic);
    }
  });

  it("never lists the primary muscle as secondary, or a muscle twice", () => {
    for (const { primaryMuscle, secondaryMuscles } of EXERCISES) {
      expect(secondaryMuscles).not.toContain(primaryMuscle);
      expect(new Set(secondaryMuscles).size).toBe(secondaryMuscles.length);
    }
  });

  it("covers every muscle group and equipment type", () => {
    const muscles = new Set(EXERCISES.map((exercise) => exercise.primaryMuscle));
    const equipment = new Set(EXERCISES.map((exercise) => exercise.equipment));
    expect([...muscles].sort()).toEqual([...MUSCLE_GROUPS].sort());
    expect([...equipment].sort()).toEqual([...EQUIPMENT].sort());
  });
});

describe("searchExercises", () => {
  it("returns everything, sorted by name, for an empty query", () => {
    const all = searchExercises("");
    expect(all).toHaveLength(EXERCISES.length);
    expect(names(all)).toEqual([...names([...EXERCISES])].sort((a, b) => a.localeCompare(b, "en")));
    expect(searchExercises("   ")).toHaveLength(EXERCISES.length);
  });

  it("matches partial names regardless of case", () => {
    expect(names(searchExercises("SQUAT"))).toEqual([
      "Barbell back squat",
      "Bulgarian split squat",
      "Front squat",
      "Goblet squat",
    ]);
    expect(names(searchExercises("pulld"))).toEqual(["Lat pulldown"]);
  });

  it("matches every word in any order", () => {
    expect(names(searchExercises("press bench"))).toEqual([
      "Barbell bench press",
      "Close-grip bench press",
      "Dumbbell bench press",
      "Incline barbell bench press",
    ]);
  });

  it("ignores punctuation", () => {
    expect(names(searchExercises("pull up"))).toEqual(["Pull-up"]);
    expect(names(searchExercises("farmers"))).toEqual(["Farmer's carry"]);
    expect(names(searchExercises("farmer’s"))).toEqual(["Farmer's carry"]);
  });

  it("filters by primary muscle", () => {
    const calves = searchExercises("", { muscle: "calves" });
    expect(names(calves)).toEqual([
      "Dumbbell calf raise",
      "Seated calf raise",
      "Standing calf raise",
    ]);
  });

  it("filters by equipment", () => {
    expect(names(searchExercises("", { equipment: "kettlebell" }))).toEqual([
      "Goblet squat",
      "Kettlebell swing",
    ]);
  });

  it("combines query and filters", () => {
    expect(names(searchExercises("curl", { muscle: "biceps", equipment: "dumbbell" }))).toEqual([
      "Dumbbell curl",
      "Hammer curl",
    ]);
    expect(names(searchExercises("", { muscle: "chest", equipment: "machine" }))).toEqual([
      "Machine chest press",
    ]);
  });

  it("returns [] when nothing matches", () => {
    expect(searchExercises("zercher")).toEqual([]);
    expect(searchExercises("", { muscle: "calves", equipment: "band" })).toEqual([]);
  });

  it("does not reorder the catalog", () => {
    const before = EXERCISES.map((exercise) => exercise.id);
    searchExercises("");
    expect(EXERCISES.map((exercise) => exercise.id)).toEqual(before);
  });
});
