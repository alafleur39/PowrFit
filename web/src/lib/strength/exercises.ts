// Built-in exercise catalog and search (P1-07).
//
// The list was approved under decision D7 on 2026-10-16. Ids are permanent:
// logs and routines store them, so rename an exercise's `name` if needed but
// never change its `id`. Search runs entirely on the device so the picker
// works offline.

import type { Equipment, Exercise, MuscleGroup } from "./types";

export const EXERCISES: readonly Exercise[] = [
  // Chest
  { id: "barbell-bench-press", name: "Barbell bench press", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "barbell", mechanic: "compound" },
  { id: "incline-barbell-bench-press", name: "Incline barbell bench press", primaryMuscle: "chest", secondaryMuscles: ["shoulders", "triceps"], equipment: "barbell", mechanic: "compound" },
  { id: "dumbbell-bench-press", name: "Dumbbell bench press", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "dumbbell", mechanic: "compound" },
  { id: "incline-dumbbell-press", name: "Incline dumbbell press", primaryMuscle: "chest", secondaryMuscles: ["shoulders", "triceps"], equipment: "dumbbell", mechanic: "compound" },
  { id: "machine-chest-press", name: "Machine chest press", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "machine", mechanic: "compound" },
  { id: "push-up", name: "Push-up", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders", "core"], equipment: "bodyweight", mechanic: "compound" },
  { id: "cable-fly", name: "Cable fly", primaryMuscle: "chest", secondaryMuscles: ["shoulders"], equipment: "cable", mechanic: "isolation" },

  // Back
  { id: "deadlift", name: "Deadlift", primaryMuscle: "back", secondaryMuscles: ["hamstrings", "glutes", "forearms"], equipment: "barbell", mechanic: "compound" },
  { id: "barbell-row", name: "Barbell row", primaryMuscle: "back", secondaryMuscles: ["biceps", "shoulders"], equipment: "barbell", mechanic: "compound" },
  { id: "one-arm-dumbbell-row", name: "One-arm dumbbell row", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "dumbbell", mechanic: "compound" },
  { id: "pull-up", name: "Pull-up", primaryMuscle: "back", secondaryMuscles: ["biceps", "forearms"], equipment: "bodyweight", mechanic: "compound" },
  { id: "chin-up", name: "Chin-up", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "bodyweight", mechanic: "compound" },
  { id: "lat-pulldown", name: "Lat pulldown", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "cable", mechanic: "compound" },
  { id: "seated-cable-row", name: "Seated cable row", primaryMuscle: "back", secondaryMuscles: ["biceps", "shoulders"], equipment: "cable", mechanic: "compound" },

  // Shoulders
  { id: "overhead-press", name: "Overhead press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps", "core"], equipment: "barbell", mechanic: "compound" },
  { id: "seated-dumbbell-shoulder-press", name: "Seated dumbbell shoulder press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "dumbbell", mechanic: "compound" },
  { id: "lateral-raise", name: "Lateral raise", primaryMuscle: "shoulders", secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation" },
  { id: "reverse-fly-machine", name: "Reverse fly machine", primaryMuscle: "shoulders", secondaryMuscles: ["back"], equipment: "machine", mechanic: "isolation" },
  { id: "face-pull", name: "Face pull", primaryMuscle: "shoulders", secondaryMuscles: ["back"], equipment: "cable", mechanic: "isolation" },
  { id: "band-pull-apart", name: "Band pull-apart", primaryMuscle: "shoulders", secondaryMuscles: ["back"], equipment: "band", mechanic: "isolation" },

  // Biceps
  { id: "barbell-curl", name: "Barbell curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "barbell", mechanic: "isolation" },
  { id: "dumbbell-curl", name: "Dumbbell curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "dumbbell", mechanic: "isolation" },
  { id: "hammer-curl", name: "Hammer curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "dumbbell", mechanic: "isolation" },
  { id: "cable-curl", name: "Cable curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "cable", mechanic: "isolation" },

  // Triceps
  { id: "triceps-pushdown", name: "Triceps pushdown", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "cable", mechanic: "isolation" },
  { id: "overhead-cable-triceps-extension", name: "Overhead cable triceps extension", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "cable", mechanic: "isolation" },
  { id: "skull-crusher", name: "Skull crusher", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "barbell", mechanic: "isolation" },
  { id: "close-grip-bench-press", name: "Close-grip bench press", primaryMuscle: "triceps", secondaryMuscles: ["chest", "shoulders"], equipment: "barbell", mechanic: "compound" },
  { id: "dip", name: "Dip", primaryMuscle: "triceps", secondaryMuscles: ["chest", "shoulders"], equipment: "bodyweight", mechanic: "compound" },

  // Forearms
  { id: "wrist-curl", name: "Wrist curl", primaryMuscle: "forearms", secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation" },
  { id: "farmers-carry", name: "Farmer's carry", primaryMuscle: "forearms", secondaryMuscles: ["core", "shoulders"], equipment: "dumbbell", mechanic: "compound" },

  // Core
  { id: "plank", name: "Plank", primaryMuscle: "core", secondaryMuscles: ["shoulders"], equipment: "bodyweight", mechanic: "isolation" },
  { id: "hanging-leg-raise", name: "Hanging leg raise", primaryMuscle: "core", secondaryMuscles: ["forearms"], equipment: "bodyweight", mechanic: "isolation" },
  { id: "cable-crunch", name: "Cable crunch", primaryMuscle: "core", secondaryMuscles: [], equipment: "cable", mechanic: "isolation" },
  { id: "ab-wheel-rollout", name: "Ab wheel rollout", primaryMuscle: "core", secondaryMuscles: ["shoulders"], equipment: "other", mechanic: "isolation" },

  // Quads
  { id: "barbell-back-squat", name: "Barbell back squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "hamstrings", "core"], equipment: "barbell", mechanic: "compound" },
  { id: "front-squat", name: "Front squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "core"], equipment: "barbell", mechanic: "compound" },
  { id: "goblet-squat", name: "Goblet squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "core"], equipment: "kettlebell", mechanic: "compound" },
  { id: "leg-press", name: "Leg press", primaryMuscle: "quads", secondaryMuscles: ["glutes", "hamstrings"], equipment: "machine", mechanic: "compound" },
  { id: "bulgarian-split-squat", name: "Bulgarian split squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "hamstrings"], equipment: "dumbbell", mechanic: "compound" },
  { id: "leg-extension", name: "Leg extension", primaryMuscle: "quads", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },

  // Hamstrings
  { id: "romanian-deadlift", name: "Romanian deadlift", primaryMuscle: "hamstrings", secondaryMuscles: ["glutes", "back"], equipment: "barbell", mechanic: "compound" },
  { id: "lying-leg-curl", name: "Lying leg curl", primaryMuscle: "hamstrings", secondaryMuscles: ["calves"], equipment: "machine", mechanic: "isolation" },
  { id: "seated-leg-curl", name: "Seated leg curl", primaryMuscle: "hamstrings", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },

  // Glutes
  { id: "barbell-hip-thrust", name: "Barbell hip thrust", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "barbell", mechanic: "compound" },
  { id: "glute-bridge", name: "Glute bridge", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "bodyweight", mechanic: "isolation" },
  { id: "cable-kickback", name: "Cable kickback", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "cable", mechanic: "isolation" },

  // Calves
  { id: "standing-calf-raise", name: "Standing calf raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },
  { id: "seated-calf-raise", name: "Seated calf raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },

  // Full body
  { id: "kettlebell-swing", name: "Kettlebell swing", primaryMuscle: "full-body", secondaryMuscles: ["glutes", "hamstrings", "core"], equipment: "kettlebell", mechanic: "compound" },
  { id: "dumbbell-thruster", name: "Dumbbell thruster", primaryMuscle: "full-body", secondaryMuscles: ["quads", "shoulders"], equipment: "dumbbell", mechanic: "compound" },
  { id: "burpee", name: "Burpee", primaryMuscle: "full-body", secondaryMuscles: ["chest", "quads", "core"], equipment: "bodyweight", mechanic: "compound" },
];

export type ExerciseFilters = {
  /** Matches the exercise's primary muscle only. */
  muscle?: MuscleGroup;
  equipment?: Equipment;
};

/**
 * Lowercases, drops apostrophes and turns other punctuation into spaces, so
 * "pull up" finds "Pull-up" and "farmers" finds "Farmer's carry".
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Case-insensitive search on name. Every word in `query` must appear, in any
 * order ("press bench" finds "Barbell bench press"). An empty query returns
 * every exercise that passes the filters. Results are sorted by name.
 */
export function searchExercises(
  query: string,
  filters: ExerciseFilters = {},
  catalog: readonly Exercise[] = EXERCISES
): Exercise[] {
  const words = normalize(query).split(" ").filter(Boolean);

  return catalog
    .filter((exercise) => {
      if (filters.muscle && exercise.primaryMuscle !== filters.muscle) return false;
      if (filters.equipment && exercise.equipment !== filters.equipment) return false;
      const name = normalize(exercise.name);
      return words.every((word) => name.includes(word));
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}
