// Built-in preset routines (P1-10): a push / pull / legs split.
//
// Presets are read-only and ship with the app, so they work offline. To
// change one, the user saves a copy to their own routines and edits that.
// Only exercise names and set/rep targets come from common programming;
// no third-party artwork or layout is reused.

import type { Routine } from "./types";

/** Fixed so presets compare equal across builds. */
const PRESET_DATE = "2026-10-16T00:00:00.000Z";

export const PRESET_ROUTINES: readonly Routine[] = [
  {
    id: "preset-push-day",
    name: "Push day",
    notes: "Chest, shoulders and triceps.",
    exercises: [
      { exerciseId: "barbell-bench-press", targetSets: 4, targetReps: "6–8" },
      { exerciseId: "incline-dumbbell-press", targetSets: 3, targetReps: "8–12" },
      { exerciseId: "seated-dumbbell-shoulder-press", targetSets: 3, targetReps: "8–12" },
      { exerciseId: "cable-fly", targetSets: 3, targetReps: "12–15" },
      { exerciseId: "lateral-raise", targetSets: 3, targetReps: "12–15" },
      { exerciseId: "triceps-pushdown", targetSets: 3, targetReps: "10–12" },
      { exerciseId: "overhead-cable-triceps-extension", targetSets: 3, targetReps: "12" },
    ],
    createdAt: PRESET_DATE,
    updatedAt: PRESET_DATE,
  },
  {
    id: "preset-pull-day",
    name: "Pull day",
    notes: "Back, rear delts and biceps.",
    exercises: [
      { exerciseId: "barbell-row", targetSets: 4, targetReps: "6" },
      { exerciseId: "lat-pulldown", targetSets: 4, targetReps: "10" },
      { exerciseId: "one-arm-dumbbell-row", targetSets: 3, targetReps: "12" },
      { exerciseId: "reverse-fly-machine", targetSets: 3, targetReps: "12" },
      { exerciseId: "machine-preacher-curl", targetSets: 4, targetReps: "12" },
      { exerciseId: "hammer-curl", targetSets: 3, targetReps: "15" },
    ],
    createdAt: PRESET_DATE,
    updatedAt: PRESET_DATE,
  },
  {
    id: "preset-leg-day",
    name: "Leg day",
    notes: "Quads, hamstrings, glutes and calves.",
    exercises: [
      { exerciseId: "barbell-back-squat", targetSets: 3, targetReps: "10" },
      { exerciseId: "romanian-deadlift", targetSets: 3, targetReps: "8–12" },
      { exerciseId: "bulgarian-split-squat", targetSets: 3, targetReps: "10–15" },
      { exerciseId: "lying-leg-curl", targetSets: 3, targetReps: "10" },
      { exerciseId: "leg-extension", targetSets: 3, targetReps: "10" },
      { exerciseId: "dumbbell-calf-raise", targetSets: 3, targetReps: "10–15" },
    ],
    createdAt: PRESET_DATE,
    updatedAt: PRESET_DATE,
  },
];
