import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { WorkoutLog } from "@/lib/strength";
import { encodeWorkoutLog } from "@/lib/workout/workout-codec";

// Runs against the Firestore emulator (npm run test:rules). The project id
// starts with "demo-", so nothing here can reach a real Firebase project.

let env: RulesTestEnvironment;

const log: WorkoutLog = {
  id: "w1",
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
const valid = encodeWorkoutLog(log);

/** A copy of `data` without the given top-level keys. */
function without(data: Record<string, unknown>, ...keys: string[]) {
  return Object.fromEntries(Object.entries(data).filter(([key]) => !keys.includes(key)));
}

const alice = () => env.authenticatedContext("alice").firestore();
const bob = () => env.authenticatedContext("bob").firestore();
const guest = () => env.unauthenticatedContext().firestore();
const aliceLog = (db = alice(), id = "w1") => db.doc(`users/alice/workoutLogs/${id}`);

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-powrfit",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

afterAll(async () => {
  await env?.cleanup();
});

describe("workoutLogs access", () => {
  it("lets the owner write, rewrite (retry) and read their workout", async () => {
    await assertSucceeds(aliceLog().set(valid));
    await assertSucceeds(aliceLog().set(valid));
    await assertSucceeds(aliceLog().get());
  });

  it("stops other users from reading or writing it", async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      ctx.firestore().doc("users/alice/workoutLogs/w1").set(valid)
    );
    await assertFails(bob().doc("users/alice/workoutLogs/w1").get());
    await assertFails(bob().doc("users/alice/workoutLogs/w1").set(valid));
    await assertFails(bob().collection("users/alice/workoutLogs").get());
  });

  it("stops signed-out access", async () => {
    await assertFails(guest().doc("users/alice/workoutLogs/w1").get());
    await assertFails(guest().doc("users/alice/workoutLogs/w1").set(valid));
  });

  it("lets the owner edit and delete their workout (P4-05)", async () => {
    await assertSucceeds(aliceLog().set(valid));
    const edited = encodeWorkoutLog({
      ...log,
      updatedAt: "2026-10-19T09:00:00.000Z",
      exercises: [{ ...log.exercises[0], sets: [{ reps: 5, weight: 145, unit: "lb", done: true }] }],
      totals: { sets: 1, reps: 5, volume: 725, unit: "lb" },
    });
    await assertSucceeds(aliceLog().set(edited));
    await assertFails(aliceLog().set({ ...edited, exercises: [] }));
    await assertSucceeds(aliceLog().delete());
  });

  it("stops other users and signed-out visitors from deleting it", async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      ctx.firestore().doc("users/alice/workoutLogs/w1").set(valid)
    );
    await assertFails(bob().doc("users/alice/workoutLogs/w1").delete());
    await assertFails(guest().doc("users/alice/workoutLogs/w1").delete());
  });

  it("lets the owner list their workouts newest first", async () => {
    await assertSucceeds(aliceLog().set(valid));
    await assertSucceeds(
      alice().collection("users/alice/workoutLogs").orderBy("endedAt", "desc").limit(20).get()
    );
  });
});

describe("workoutLogs validation", () => {
  const withoutRoutine = without(valid, "routineId", "routineName");

  it("accepts a workout without a routine", async () => {
    await assertSucceeds(aliceLog().set(withoutRoutine));
  });

  it.each([
    ["an id that doesn't match the document", { ...valid, id: "other" }],
    ["a newer schemaVersion", { ...valid, schemaVersion: 2 }],
    ["an extra top-level field", { ...valid, admin: true }],
    ["a missing field", without(valid, "totals")],
    ["no exercises", { ...valid, exercises: [] }],
    ["too many exercises", { ...valid, exercises: Array.from({ length: 31 }, () => (valid.exercises as unknown[])[0]) }],
    ["a bad unit", { ...valid, totals: { sets: 1, reps: 6, volume: 810, unit: "stone" } }],
    ["negative volume", { ...valid, totals: { sets: 1, reps: 6, volume: -1, unit: "lb" } }],
    ["fractional set count", { ...valid, totals: { sets: 1.5, reps: 6, volume: 810, unit: "lb" } }],
    ["a timestamp that isn't a string", { ...valid, endedAt: 12345 }],
  ])("rejects %s", async (_name, data) => {
    await assertFails(aliceLog().set(data));
  });
});

describe("settings and legacy data", () => {
  it("lets the owner set kg or lb only", async () => {
    const prefs = alice().doc("users/alice/settings/preferences");
    await assertSucceeds(prefs.set({ weightUnit: "kg" }));
    await assertFails(prefs.set({ weightUnit: "stone" }));
    await assertFails(prefs.set({ weightUnit: "kg", extra: 1 }));
    await assertFails(bob().doc("users/alice/settings/preferences").get());
  });

  it("keeps legacy collections read-only for their owner", async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      ctx.firestore().doc("users/alice/workoutSessions/s1").set({ title: "HIIT" })
    );
    await assertSucceeds(alice().doc("users/alice/workoutSessions/s1").get());
    await assertFails(alice().doc("users/alice/workoutSessions/s2").set({ title: "x" }));
    await assertFails(bob().doc("users/alice/workoutSessions/s1").get());
  });

  it("denies paths nobody declared", async () => {
    await assertFails(alice().doc("users/alice/anything/else").set({ a: 1 }));
    await assertFails(alice().doc("other/doc").set({ a: 1 }));
  });
});

describe("offline retry", () => {
  it("leaves exactly one document after an offline save, reconnect and retry", async () => {
    const db = alice();
    await db.disableNetwork();
    const offlineSave = aliceLog(db).set(valid); // queued while offline
    await db.enableNetwork();
    await offlineSave;
    await aliceLog(db).set(valid); // the app's retry after a reload

    const all = await db.collection("users/alice/workoutLogs").get();
    expect(all.size).toBe(1);
    expect(all.docs[0].id).toBe("w1");
  });
});
