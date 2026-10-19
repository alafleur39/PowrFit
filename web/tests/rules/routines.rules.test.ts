import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

import type { Routine } from "@/lib/strength";
import { encodeRoutine } from "@/lib/workout/routine-codec";

// Runs against the Firestore emulator (npm run test:rules), project demo-powrfit.

let env: RulesTestEnvironment;

const routine: Routine = {
  id: "r1",
  name: "Back",
  notes: "Rows first",
  exercises: [{ exerciseId: "barbell-row", targetSets: 4, targetReps: "6", restSec: 120 }],
  createdAt: "2026-10-18T10:00:00.000Z",
  updatedAt: "2026-10-18T10:00:00.000Z",
};
const valid = encodeRoutine(routine);

const alice = () => env.authenticatedContext("alice").firestore();
const bob = () => env.authenticatedContext("bob").firestore();
const guest = () => env.unauthenticatedContext().firestore();
const aliceRoutine = (db = alice()) => db.doc("users/alice/routines/r1");

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

describe("routines access", () => {
  it("lets the owner create, update, list and delete their routine", async () => {
    await assertSucceeds(aliceRoutine().set(valid));
    await assertSucceeds(aliceRoutine().set({ ...valid, name: "Back and biceps" }));
    await assertSucceeds(alice().collection("users/alice/routines").orderBy("updatedAt", "desc").get());
    await assertSucceeds(aliceRoutine().delete());
  });

  it("stops other users and signed-out visitors", async () => {
    await env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc("users/alice/routines/r1").set(valid));
    await assertFails(bob().doc("users/alice/routines/r1").get());
    await assertFails(bob().doc("users/alice/routines/r1").set(valid));
    await assertFails(bob().doc("users/alice/routines/r1").delete());
    await assertFails(guest().doc("users/alice/routines/r1").get());
  });
});

describe("routines validation", () => {
  it("accepts a routine without notes", async () => {
    const { notes: _notes, ...withoutNotes } = valid;
    void _notes;
    await assertSucceeds(aliceRoutine().set(withoutNotes));
  });

  it.each([
    ["an id that doesn't match the document", { ...valid, id: "other" }],
    ["an empty name", { ...valid, name: "" }],
    ["a name over 60 characters", { ...valid, name: "x".repeat(61) }],
    ["notes over 300 characters", { ...valid, notes: "x".repeat(301) }],
    ["no exercises", { ...valid, exercises: [] }],
    ["more than 30 exercises", { ...valid, exercises: Array.from({ length: 31 }, () => (valid.exercises as unknown[])[0]) }],
    ["a newer schemaVersion", { ...valid, schemaVersion: 2 }],
    ["an extra field", { ...valid, shared: true }],
  ])("rejects %s", async (_name, data) => {
    await assertFails(aliceRoutine().set(data));
  });
});
