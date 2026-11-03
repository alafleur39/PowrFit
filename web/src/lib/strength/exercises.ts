// Built-in exercise catalog and search (P1-07).
//
// The list was approved under decision D7 on 2026-10-16; machine preacher
// curl and dumbbell calf raise were added the same day for the preset
// routines (P1-10). 71 more on 2026-11-02 so gyms with different machines
// are covered (Smith machine, hack squat, pec deck, assisted and plate-loaded
// machines, as listed on PureGym's equipment pages). Ids are permanent: logs and routines store them, so
// rename an exercise's `name` if needed but never change its `id`. Search runs entirely on the device so the picker
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
  { id: "decline-barbell-bench-press", name: "Decline barbell bench press", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "barbell", mechanic: "compound" },
  { id: "smith-machine-bench-press", name: "Smith machine bench press", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "machine", mechanic: "compound" },
  { id: "smith-machine-incline-press", name: "Smith machine incline press", primaryMuscle: "chest", secondaryMuscles: ["shoulders", "triceps"], equipment: "machine", mechanic: "compound" },
  { id: "incline-machine-chest-press", name: "Incline machine chest press", primaryMuscle: "chest", secondaryMuscles: ["shoulders", "triceps"], equipment: "machine", mechanic: "compound" },
  { id: "pec-deck", name: "Pec deck", primaryMuscle: "chest", secondaryMuscles: ["shoulders"], equipment: "machine", mechanic: "isolation" },
  { id: "dumbbell-fly", name: "Dumbbell fly", primaryMuscle: "chest", secondaryMuscles: ["shoulders"], equipment: "dumbbell", mechanic: "isolation" },
  { id: "low-to-high-cable-fly", name: "Low-to-high cable fly", primaryMuscle: "chest", secondaryMuscles: ["shoulders"], equipment: "cable", mechanic: "isolation" },

  // Back
  { id: "deadlift", name: "Deadlift", primaryMuscle: "back", secondaryMuscles: ["hamstrings", "glutes", "forearms"], equipment: "barbell", mechanic: "compound" },
  { id: "barbell-row", name: "Barbell row", primaryMuscle: "back", secondaryMuscles: ["biceps", "shoulders"], equipment: "barbell", mechanic: "compound" },
  { id: "one-arm-dumbbell-row", name: "One-arm dumbbell row", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "dumbbell", mechanic: "compound" },
  { id: "pull-up", name: "Pull-up", primaryMuscle: "back", secondaryMuscles: ["biceps", "forearms"], equipment: "bodyweight", mechanic: "compound" },
  { id: "chin-up", name: "Chin-up", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "bodyweight", mechanic: "compound" },
  { id: "lat-pulldown", name: "Lat pulldown", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "cable", mechanic: "compound" },
  { id: "seated-cable-row", name: "Seated cable row", primaryMuscle: "back", secondaryMuscles: ["biceps", "shoulders"], equipment: "cable", mechanic: "compound" },
  { id: "assisted-pull-up", name: "Assisted pull-up", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "machine", mechanic: "compound" },
  { id: "seated-machine-row", name: "Seated machine row", primaryMuscle: "back", secondaryMuscles: ["biceps", "shoulders"], equipment: "machine", mechanic: "compound" },
  { id: "t-bar-row", name: "T-bar row", primaryMuscle: "back", secondaryMuscles: ["biceps", "shoulders"], equipment: "barbell", mechanic: "compound" },
  { id: "chest-supported-dumbbell-row", name: "Chest-supported dumbbell row", primaryMuscle: "back", secondaryMuscles: ["biceps", "shoulders"], equipment: "dumbbell", mechanic: "compound" },
  { id: "straight-arm-pulldown", name: "Straight-arm pulldown", primaryMuscle: "back", secondaryMuscles: ["shoulders"], equipment: "cable", mechanic: "isolation" },
  { id: "one-arm-cable-row", name: "One-arm cable row", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "cable", mechanic: "compound" },
  { id: "close-grip-lat-pulldown", name: "Close-grip lat pulldown", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "cable", mechanic: "compound" },
  { id: "back-extension", name: "Back extension", primaryMuscle: "back", secondaryMuscles: ["glutes", "hamstrings"], equipment: "bodyweight", mechanic: "isolation" },
  { id: "rack-pull", name: "Rack pull", primaryMuscle: "back", secondaryMuscles: ["glutes", "hamstrings", "forearms"], equipment: "barbell", mechanic: "compound" },
  { id: "inverted-row", name: "Inverted row", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "bodyweight", mechanic: "compound" },
  { id: "dumbbell-shrug", name: "Dumbbell shrug", primaryMuscle: "back", secondaryMuscles: ["forearms"], equipment: "dumbbell", mechanic: "isolation" },
  { id: "resistance-band-row", name: "Resistance band row", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "band", mechanic: "compound" },

  // Shoulders
  { id: "overhead-press", name: "Overhead press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps", "core"], equipment: "barbell", mechanic: "compound" },
  { id: "seated-dumbbell-shoulder-press", name: "Seated dumbbell shoulder press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "dumbbell", mechanic: "compound" },
  { id: "lateral-raise", name: "Lateral raise", primaryMuscle: "shoulders", secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation" },
  { id: "reverse-fly-machine", name: "Reverse fly machine", primaryMuscle: "shoulders", secondaryMuscles: ["back"], equipment: "machine", mechanic: "isolation" },
  { id: "face-pull", name: "Face pull", primaryMuscle: "shoulders", secondaryMuscles: ["back"], equipment: "cable", mechanic: "isolation" },
  { id: "band-pull-apart", name: "Band pull-apart", primaryMuscle: "shoulders", secondaryMuscles: ["back"], equipment: "band", mechanic: "isolation" },
  { id: "machine-shoulder-press", name: "Machine shoulder press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "machine", mechanic: "compound" },
  { id: "smith-machine-shoulder-press", name: "Smith machine shoulder press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "machine", mechanic: "compound" },
  { id: "arnold-press", name: "Arnold press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "dumbbell", mechanic: "compound" },
  { id: "cable-lateral-raise", name: "Cable lateral raise", primaryMuscle: "shoulders", secondaryMuscles: [], equipment: "cable", mechanic: "isolation" },
  { id: "machine-lateral-raise", name: "Machine lateral raise", primaryMuscle: "shoulders", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },
  { id: "dumbbell-front-raise", name: "Dumbbell front raise", primaryMuscle: "shoulders", secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation" },
  { id: "bent-over-reverse-fly", name: "Bent-over reverse fly", primaryMuscle: "shoulders", secondaryMuscles: ["back"], equipment: "dumbbell", mechanic: "isolation" },

  // Biceps
  { id: "barbell-curl", name: "Barbell curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "barbell", mechanic: "isolation" },
  { id: "dumbbell-curl", name: "Dumbbell curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "dumbbell", mechanic: "isolation" },
  { id: "hammer-curl", name: "Hammer curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "dumbbell", mechanic: "isolation" },
  { id: "cable-curl", name: "Cable curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "cable", mechanic: "isolation" },
  { id: "machine-preacher-curl", name: "Machine preacher curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "machine", mechanic: "isolation" },
  { id: "ez-bar-curl", name: "EZ-bar curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "barbell", mechanic: "isolation" },
  { id: "ez-bar-preacher-curl", name: "EZ-bar preacher curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "barbell", mechanic: "isolation" },
  { id: "incline-dumbbell-curl", name: "Incline dumbbell curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "dumbbell", mechanic: "isolation" },
  { id: "concentration-curl", name: "Concentration curl", primaryMuscle: "biceps", secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation" },
  { id: "machine-biceps-curl", name: "Machine biceps curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "machine", mechanic: "isolation" },
  { id: "rope-hammer-curl", name: "Rope hammer curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], equipment: "cable", mechanic: "isolation" },

  // Triceps
  { id: "triceps-pushdown", name: "Triceps pushdown", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "cable", mechanic: "isolation" },
  { id: "overhead-cable-triceps-extension", name: "Overhead cable triceps extension", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "cable", mechanic: "isolation" },
  { id: "skull-crusher", name: "Skull crusher", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "barbell", mechanic: "isolation" },
  { id: "close-grip-bench-press", name: "Close-grip bench press", primaryMuscle: "triceps", secondaryMuscles: ["chest", "shoulders"], equipment: "barbell", mechanic: "compound" },
  { id: "dip", name: "Dip", primaryMuscle: "triceps", secondaryMuscles: ["chest", "shoulders"], equipment: "bodyweight", mechanic: "compound" },
  { id: "rope-triceps-pushdown", name: "Rope triceps pushdown", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "cable", mechanic: "isolation" },
  { id: "assisted-dip", name: "Assisted dip", primaryMuscle: "triceps", secondaryMuscles: ["chest", "shoulders"], equipment: "machine", mechanic: "compound" },
  { id: "seated-dip-machine", name: "Seated dip machine", primaryMuscle: "triceps", secondaryMuscles: ["chest", "shoulders"], equipment: "machine", mechanic: "compound" },
  { id: "machine-triceps-extension", name: "Machine triceps extension", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },
  { id: "overhead-dumbbell-triceps-extension", name: "Overhead dumbbell triceps extension", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation" },
  { id: "dumbbell-kickback", name: "Dumbbell kickback", primaryMuscle: "triceps", secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation" },
  { id: "bench-dip", name: "Bench dip", primaryMuscle: "triceps", secondaryMuscles: ["chest", "shoulders"], equipment: "bodyweight", mechanic: "compound" },

  // Forearms
  { id: "wrist-curl", name: "Wrist curl", primaryMuscle: "forearms", secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation" },
  { id: "farmers-carry", name: "Farmer's carry", primaryMuscle: "forearms", secondaryMuscles: ["core", "shoulders"], equipment: "dumbbell", mechanic: "compound" },
  { id: "reverse-curl", name: "Reverse curl", primaryMuscle: "forearms", secondaryMuscles: ["biceps"], equipment: "barbell", mechanic: "isolation" },

  // Core
  { id: "plank", name: "Plank", primaryMuscle: "core", secondaryMuscles: ["shoulders"], equipment: "bodyweight", mechanic: "isolation" },
  { id: "hanging-leg-raise", name: "Hanging leg raise", primaryMuscle: "core", secondaryMuscles: ["forearms"], equipment: "bodyweight", mechanic: "isolation" },
  { id: "cable-crunch", name: "Cable crunch", primaryMuscle: "core", secondaryMuscles: [], equipment: "cable", mechanic: "isolation" },
  { id: "ab-wheel-rollout", name: "Ab wheel rollout", primaryMuscle: "core", secondaryMuscles: ["shoulders"], equipment: "other", mechanic: "isolation" },
  { id: "ab-crunch-machine", name: "Ab crunch machine", primaryMuscle: "core", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },
  { id: "crunch", name: "Crunch", primaryMuscle: "core", secondaryMuscles: [], equipment: "bodyweight", mechanic: "isolation" },
  { id: "decline-sit-up", name: "Decline sit-up", primaryMuscle: "core", secondaryMuscles: [], equipment: "bodyweight", mechanic: "isolation" },
  { id: "russian-twist", name: "Russian twist", primaryMuscle: "core", secondaryMuscles: [], equipment: "bodyweight", mechanic: "isolation" },
  { id: "dead-bug", name: "Dead bug", primaryMuscle: "core", secondaryMuscles: [], equipment: "bodyweight", mechanic: "isolation" },
  { id: "captains-chair-leg-raise", name: "Captain's chair leg raise", primaryMuscle: "core", secondaryMuscles: [], equipment: "bodyweight", mechanic: "isolation" },
  { id: "cable-woodchopper", name: "Cable woodchopper", primaryMuscle: "core", secondaryMuscles: ["shoulders"], equipment: "cable", mechanic: "isolation" },
  { id: "pallof-press", name: "Pallof press", primaryMuscle: "core", secondaryMuscles: ["shoulders"], equipment: "cable", mechanic: "isolation" },
  { id: "torso-rotation-machine", name: "Torso rotation machine", primaryMuscle: "core", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },
  { id: "mountain-climber", name: "Mountain climber", primaryMuscle: "core", secondaryMuscles: ["shoulders", "quads"], equipment: "bodyweight", mechanic: "compound" },

  // Quads
  { id: "barbell-back-squat", name: "Barbell back squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "hamstrings", "core"], equipment: "barbell", mechanic: "compound" },
  { id: "front-squat", name: "Front squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "core"], equipment: "barbell", mechanic: "compound" },
  { id: "goblet-squat", name: "Goblet squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "core"], equipment: "kettlebell", mechanic: "compound" },
  { id: "leg-press", name: "Leg press", primaryMuscle: "quads", secondaryMuscles: ["glutes", "hamstrings"], equipment: "machine", mechanic: "compound" },
  { id: "bulgarian-split-squat", name: "Bulgarian split squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "hamstrings"], equipment: "dumbbell", mechanic: "compound" },
  { id: "leg-extension", name: "Leg extension", primaryMuscle: "quads", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },
  { id: "hack-squat", name: "Hack squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "hamstrings"], equipment: "machine", mechanic: "compound" },
  { id: "smith-machine-squat", name: "Smith machine squat", primaryMuscle: "quads", secondaryMuscles: ["glutes", "hamstrings"], equipment: "machine", mechanic: "compound" },
  { id: "dumbbell-walking-lunge", name: "Dumbbell walking lunge", primaryMuscle: "quads", secondaryMuscles: ["glutes", "hamstrings"], equipment: "dumbbell", mechanic: "compound" },
  { id: "dumbbell-reverse-lunge", name: "Dumbbell reverse lunge", primaryMuscle: "quads", secondaryMuscles: ["glutes", "hamstrings"], equipment: "dumbbell", mechanic: "compound" },
  { id: "dumbbell-step-up", name: "Dumbbell step-up", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "dumbbell", mechanic: "compound" },
  { id: "bodyweight-squat", name: "Bodyweight squat", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "bodyweight", mechanic: "compound" },

  // Hamstrings
  { id: "romanian-deadlift", name: "Romanian deadlift", primaryMuscle: "hamstrings", secondaryMuscles: ["glutes", "back"], equipment: "barbell", mechanic: "compound" },
  { id: "lying-leg-curl", name: "Lying leg curl", primaryMuscle: "hamstrings", secondaryMuscles: ["calves"], equipment: "machine", mechanic: "isolation" },
  { id: "seated-leg-curl", name: "Seated leg curl", primaryMuscle: "hamstrings", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },
  { id: "dumbbell-romanian-deadlift", name: "Dumbbell Romanian deadlift", primaryMuscle: "hamstrings", secondaryMuscles: ["glutes", "back"], equipment: "dumbbell", mechanic: "compound" },
  { id: "good-morning", name: "Good morning", primaryMuscle: "hamstrings", secondaryMuscles: ["glutes", "back"], equipment: "barbell", mechanic: "compound" },
  { id: "standing-leg-curl", name: "Standing leg curl", primaryMuscle: "hamstrings", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },

  // Glutes
  { id: "barbell-hip-thrust", name: "Barbell hip thrust", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "barbell", mechanic: "compound" },
  { id: "glute-bridge", name: "Glute bridge", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "bodyweight", mechanic: "isolation" },
  { id: "cable-kickback", name: "Cable kickback", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "cable", mechanic: "isolation" },
  { id: "hip-abduction-machine", name: "Hip abduction machine", primaryMuscle: "glutes", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },
  { id: "glute-kickback-machine", name: "Glute kickback machine", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "machine", mechanic: "isolation" },
  { id: "hip-thrust-machine", name: "Hip thrust machine", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "machine", mechanic: "compound" },
  { id: "smith-machine-hip-thrust", name: "Smith machine hip thrust", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "machine", mechanic: "compound" },
  { id: "cable-pull-through", name: "Cable pull-through", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "cable", mechanic: "compound" },
  { id: "sumo-deadlift", name: "Sumo deadlift", primaryMuscle: "glutes", secondaryMuscles: ["quads", "hamstrings", "back"], equipment: "barbell", mechanic: "compound" },
  { id: "banded-lateral-walk", name: "Banded lateral walk", primaryMuscle: "glutes", secondaryMuscles: [], equipment: "band", mechanic: "isolation" },

  // Calves
  { id: "standing-calf-raise", name: "Standing calf raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },
  { id: "seated-calf-raise", name: "Seated calf raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },
  { id: "dumbbell-calf-raise", name: "Dumbbell calf raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "dumbbell", mechanic: "isolation" },
  { id: "leg-press-calf-raise", name: "Leg press calf raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },
  { id: "smith-machine-calf-raise", name: "Smith machine calf raise", primaryMuscle: "calves", secondaryMuscles: [], equipment: "machine", mechanic: "isolation" },

  // Full body
  { id: "kettlebell-swing", name: "Kettlebell swing", primaryMuscle: "full-body", secondaryMuscles: ["glutes", "hamstrings", "core"], equipment: "kettlebell", mechanic: "compound" },
  { id: "dumbbell-thruster", name: "Dumbbell thruster", primaryMuscle: "full-body", secondaryMuscles: ["quads", "shoulders"], equipment: "dumbbell", mechanic: "compound" },
  { id: "burpee", name: "Burpee", primaryMuscle: "full-body", secondaryMuscles: ["chest", "quads", "core"], equipment: "bodyweight", mechanic: "compound" },
  { id: "kettlebell-clean-and-press", name: "Kettlebell clean and press", primaryMuscle: "full-body", secondaryMuscles: ["shoulders", "glutes"], equipment: "kettlebell", mechanic: "compound" },
  { id: "medicine-ball-slam", name: "Medicine ball slam", primaryMuscle: "full-body", secondaryMuscles: ["core", "shoulders"], equipment: "other", mechanic: "compound" },
  { id: "sled-push", name: "Sled push", primaryMuscle: "full-body", secondaryMuscles: ["quads", "glutes"], equipment: "other", mechanic: "compound" },
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
