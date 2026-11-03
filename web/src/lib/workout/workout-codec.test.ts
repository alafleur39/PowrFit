import { describe, expect, it } from "vitest";

import type { WorkoutLog } from "@/lib/strength";
import { decodeWorkoutLog, encodeWorkoutLog } from "./workout-codec";
import { classifyError, errorCode, syncStatusFromMetadata } from "./sync-status";

const log: WorkoutLog = {
  id: "3f1c9a52-6a0e-4b8e-9d55-2f6f3c1d7e10",
  schemaVersion: 2,
  routineId: "preset-pull-day",
  routineName: "Pull day",
  startedAt: "2026-10-16T17:00:00.000Z",
  endedAt: "2026-10-16T18:00:00.000Z",
  updatedAt: "2026-10-16T18:00:00.000Z",
  exercises: [
    {
      exerciseId: "barbell-row",
      exerciseName: "Barbell row",
      sets: [{ reps: 6, weight: 135, unit: "lb", done: true }],
    },
  ],
  exerciseIds: ["barbell-row"],
  totals: { sets: 1, reps: 6, volume: 810, unit: "lb", cardioSec: 0 },
};

describe("encodeWorkoutLog / decodeWorkoutLog", () => {
  it("round-trips a log", () => {
    expect(decodeWorkoutLog(log.id, encodeWorkoutLog(log))).toEqual({ ok: true, log });
  });

  it("leaves out undefined optional fields (Firestore rejects undefined)", () => {
    const empty: WorkoutLog = { ...log };
    delete empty.routineId;
    delete empty.routineName;
    const encoded = encodeWorkoutLog(empty);
    expect(Object.values(encoded)).not.toContain(undefined);
    expect("routineId" in encoded).toBe(false);
    expect(decodeWorkoutLog(log.id, encoded)).toEqual({ ok: true, log: empty });
  });

  it("ignores unknown extra fields", () => {
    const result = decodeWorkoutLog(log.id, { ...encodeWorkoutLog(log), extra: true });
    expect(result).toEqual({ ok: true, log });
  });

  it("reports a newer schema as unsupported, not invalid", () => {
    const result = decodeWorkoutLog(log.id, { ...encodeWorkoutLog(log), schemaVersion: 3 });
    expect(result).toMatchObject({ ok: false, reason: "unsupported" });
  });

  it("reads a version 1 log (before cardio) as version 2 with no cardio time", () => {
    const v1 = encodeWorkoutLog(log) as { totals: Record<string, unknown> };
    delete v1.totals.cardioSec;
    expect(decodeWorkoutLog(log.id, { ...v1, schemaVersion: 1 })).toEqual({ ok: true, log });
  });

  it("round-trips cardio sets, writing only the stats that were entered", () => {
    const cardio: WorkoutLog = {
      ...log,
      exercises: [
        ...log.exercises,
        {
          exerciseId: "stair-climber",
          exerciseName: "Stair climber",
          sets: [
            { durationSec: 1200, level: 8, floors: 95, calories: 210, done: true },
            { durationSec: 300, done: true },
          ],
        },
        {
          exerciseId: "treadmill",
          exerciseName: "Treadmill",
          sets: [{ durationSec: 900, distance: 1.5, distanceUnit: "mi", inclinePct: 3, done: true }],
        },
      ],
      exerciseIds: ["barbell-row", "stair-climber", "treadmill"],
      totals: { sets: 4, reps: 6, volume: 810, unit: "lb", cardioSec: 2400 },
    };
    const encoded = encodeWorkoutLog(cardio) as { exercises: { sets: object[] }[] };
    expect(encoded.exercises[1].sets[1]).toEqual({ durationSec: 300, done: true });
    expect(decodeWorkoutLog(log.id, encoded)).toEqual({ ok: true, log: cardio });
  });

  it.each([
    ["no time", { durationSec: 0, done: true }],
    ["a fractional time", { durationSec: 1.5, done: true }],
    ["a distance without a unit", { durationSec: 60, distance: 1, done: true }],
    ["a bad distance unit", { durationSec: 60, distance: 1, distanceUnit: "ft", done: true }],
    ["negative floors", { durationSec: 60, floors: -1, done: true }],
  ])("rejects a cardio set with %s", (_name, set) => {
    const encoded = encodeWorkoutLog(log) as { exercises: { sets: object[] }[] };
    encoded.exercises[0].sets = [set];
    expect(decodeWorkoutLog(log.id, encoded)).toMatchObject({ ok: false, reason: "invalid" });
  });

  it.each([
    ["missing data", undefined],
    ["id mismatch", { ...encodeWorkoutLog(log), id: "other" }],
    ["string reps", { ...encodeWorkoutLog(log), exercises: [{ exerciseId: "a", exerciseName: "A", sets: [{ reps: "6", weight: 1, unit: "lb", done: true }] }] }],
    ["negative weight", { ...encodeWorkoutLog(log), exercises: [{ exerciseId: "a", exerciseName: "A", sets: [{ reps: 6, weight: -1, unit: "lb", done: true }] }] }],
    ["bad unit", { ...encodeWorkoutLog(log), totals: { sets: 1, reps: 6, volume: 1, unit: "stone" } }],
    ["fractional reps", { ...encodeWorkoutLog(log), exercises: [{ exerciseId: "a", exerciseName: "A", sets: [{ reps: 2.5, weight: 1, unit: "lb", done: true }] }] }],
    ["missing endedAt", { ...encodeWorkoutLog(log), endedAt: undefined }],
    ["exerciseIds not strings", { ...encodeWorkoutLog(log), exerciseIds: [1] }],
  ])("rejects a document with %s", (_name, data) => {
    expect(decodeWorkoutLog(log.id, data)).toMatchObject({ ok: false, reason: "invalid" });
  });
});

describe("sync status", () => {
  it("is pending until the server acknowledges local writes", () => {
    expect(syncStatusFromMetadata({ hasPendingWrites: true })).toBe("pending");
    expect(syncStatusFromMetadata({ hasPendingWrites: false })).toBe("synced");
  });

  it.each(["unavailable", "deadline-exceeded", "resource-exhausted", "aborted", "internal"])(
    "treats %s as retryable",
    (code) => expect(classifyError(code)).toBe("retryable")
  );

  it.each(["permission-denied", "invalid-argument", "failed-precondition", "unauthenticated", undefined])(
    "treats %s as fatal",
    (code) => expect(classifyError(code)).toBe("fatal")
  );

  it("reads codes from Firestore errors", () => {
    expect(errorCode({ code: "permission-denied" })).toBe("permission-denied");
    expect(errorCode({ code: "firestore/unavailable" })).toBe("unavailable");
    expect(errorCode(new Error("boom"))).toBeUndefined();
    expect(errorCode(null)).toBeUndefined();
  });
});
