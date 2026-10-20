import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

// P6-12: users/{uid}/settings/profile. Runs against the Firestore emulator.

let env: RulesTestEnvironment;

const valid = {
  displayName: "Andy",
  avatar: { kind: "initials", color: "yellow" },
  updatedAt: "2026-10-19T18:00:00.000Z",
};

const alice = () => env.authenticatedContext("alice").firestore();
const bob = () => env.authenticatedContext("bob").firestore();
const guest = () => env.unauthenticatedContext().firestore();
const profile = (db = alice()) => db.doc("users/alice/settings/profile");

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

describe("profile", () => {
  it("lets the owner write, read and delete it", async () => {
    await assertSucceeds(profile().set(valid));
    await assertSucceeds(profile().set({ ...valid, displayName: "Andy L" }));
    await assertSucceeds(profile().get());
    await assertSucceeds(profile().delete());
  });

  it("keeps it private", async () => {
    await env.withSecurityRulesDisabled((ctx) => ctx.firestore().doc("users/alice/settings/profile").set(valid));
    await assertFails(profile(bob()).get());
    await assertFails(profile(bob()).set(valid));
    await assertFails(profile(guest()).get());
  });

  it.each([
    ["an empty name", { ...valid, displayName: "" }],
    ["a name over 40 characters", { ...valid, displayName: "x".repeat(41) }],
    ["a photo avatar", { ...valid, avatar: { kind: "photo", url: "https://example.com/me.jpg" } }],
    ["an unknown colour", { ...valid, avatar: { kind: "initials", color: "teal" } }],
    ["an extra field", { ...valid, admin: true }],
    ["a missing field", { displayName: "Andy", avatar: valid.avatar }],
  ])("rejects %s", async (_name, data) => {
    await assertFails(profile().set(data));
  });
});
