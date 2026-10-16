import { describe, expect, it } from "vitest";

import type { WorkoutLog } from "@/lib/strength";
import { decodeWorkoutLog, encodeWorkoutLog } from "./workout-codec";
import { classifyError, errorCode, syncStatusFromMetadata } from "./sync-status";

const log: WorkoutLog = {
  id: "3f1c9a52-6a0e-4b8e-9d55-2f6f3c1d7e10",
  schemaVersion: 1,
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
  totals: { sets: 1, reps: 6, volume: 810, unit: "lb" },
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
    const result = decodeWorkoutLog(log.id, { ...encodeWorkoutLog(log), schemaVersion: 2 });
    expect(result).toMatchObject({ ok: false, reason: "unsupported" });
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
