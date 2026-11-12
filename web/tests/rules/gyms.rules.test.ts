import { readFileSync } from "node:fs";
import {
  type RulesTestContext,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

// P6-04: gyms (shared, read-only) and gymPriceReports (create-only;
// since Nov 2026 they record their sender, one per user per gym, at most
// one every 30 seconds). The first data in PowrFit that isn't private to one user,
// so this is where a Tea-style leak would start. Runs against the emulator.

let env: RulesTestEnvironment;

const prices = {
  name: "Iron Den",
  plans: [{ name: "Basic", monthlyPrice: 25, currency: "USD" }],
  source: "gym website",
  checkedAt: "2026-10-19",
};
const report = {
  placeId: "osm-node-42",
  gymName: "Iron Den",
  plan: "Basic",
  monthlyPrice: 25,
  currency: "USD",
  createdAt: "2026-10-19T18:00:00.000Z",
};

const alice = () => env.authenticatedContext("alice").firestore();
const bob = () => env.authenticatedContext("bob").firestore();
const guest = () => env.unauthenticatedContext().firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-powrfit",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("gyms/osm-node-42").set(prices);
    await ctx.firestore().doc("gymPriceReports/r1").set(report);
  });
});

afterAll(async () => {
  await env?.cleanup();
});

describe("gyms", () => {
  it("lets signed-in users read a gym's prices by id", async () => {
    await assertSucceeds(alice().doc("gyms/osm-node-42").get());
    await assertFails(guest().doc("gyms/osm-node-42").get());
  });

  it("lets nobody list, write or delete gyms through the app", async () => {
    await assertFails(alice().collection("gyms").get());
    await assertFails(alice().doc("gyms/osm-node-42").set({ ...prices, name: "Mine now" }));
    await assertFails(alice().doc("gyms/osm-node-7").set(prices));
    await assertFails(alice().doc("gyms/osm-node-42").delete());
  });
});

/** The app's write: the report and the sender's reportLimits time in one batch. */
type Db = ReturnType<RulesTestContext["firestore"]>;

function send(db: Db, uid: string, data: Record<string, unknown>, id = `${uid}_${data.placeId}`) {
  const batch = db.batch();
  batch.set(db.doc(`gymPriceReports/${id}`), data);
  batch.set(db.doc(`reportLimits/${uid}`), { lastAt: firebase.firestore.FieldValue.serverTimestamp() });
  return batch.commit();
}

const mine = { ...report, uid: "alice" };

/** Moves alice's last report back in time, as if she sent it a while ago. */
async function lastReportedSecondsAgo(seconds: number) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("reportLimits/alice").set({ lastAt: new Date(Date.now() - seconds * 1000) });
  });
}

describe("gymPriceReports", () => {
  it("lets a signed-in user send a report with their id, and nothing else", async () => {
    await assertSucceeds(send(alice(), "alice", mine));
    await assertFails(send(guest(), "alice", mine));
    await assertFails(alice().doc("gymPriceReports/r1").get());
    await assertFails(alice().doc("gymPriceReports/alice_osm-node-42").get());
    await assertFails(bob().collection("gymPriceReports").get());
    await assertFails(alice().collectionGroup("gymPriceReports").get());
    await assertFails(alice().doc("gymPriceReports/r1").set({ ...report, monthlyPrice: 1 }));
    await assertFails(alice().doc("gymPriceReports/r1").delete());
    await assertFails(alice().doc("reportLimits/alice").get());
  });

  it("refuses a report without the reportLimits time in the same batch", async () => {
    await assertFails(alice().doc("gymPriceReports/alice_osm-node-42").set(mine));
  });

  it("refuses a report sent as someone else or under another id", async () => {
    await assertFails(send(bob(), "bob", mine, "bob_osm-node-42"));
    await assertFails(send(alice(), "alice", mine, "alice_osm-node-7"));
    await assertFails(send(alice(), "alice", mine, "r2"));
  });

  it("allows one report every 30 seconds", async () => {
    await assertSucceeds(send(alice(), "alice", mine));
    await assertFails(send(alice(), "alice", { ...mine, placeId: "osm-node-7" }));
    await lastReportedSecondsAgo(31);
    await assertSucceeds(send(alice(), "alice", { ...mine, placeId: "osm-node-7" }));
  });

  it("lets the sender correct their report for a gym, but nobody else", async () => {
    await assertSucceeds(send(alice(), "alice", mine));
    await lastReportedSecondsAgo(31);
    await assertSucceeds(send(alice(), "alice", { ...mine, monthlyPrice: 30 }));
    await assertFails(send(bob(), "bob", { ...mine, uid: "bob" }, "alice_osm-node-42"));
  });

  it("can't skip the wait by deleting or backdating the time", async () => {
    await assertSucceeds(send(alice(), "alice", mine));
    await assertFails(alice().doc("reportLimits/alice").delete());
    await assertFails(alice().doc("reportLimits/alice").set({ lastAt: new Date(0) }));
  });

  it("refuses reports from a banned user", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc("bannedUsers/alice").set({ reason: "spam" });
    });
    await assertFails(send(alice(), "alice", mine));
    await assertFails(alice().doc("bannedUsers/alice").get());
    await assertFails(bob().doc("bannedUsers/bob").set({}));
  });

  it.each([
    ["no sender id", report],
    ["another user's id", { ...mine, uid: "bob" }],
    ["a bad place id", { ...mine, placeId: "../users/alice" }],
    ["a zero price", { ...mine, monthlyPrice: 0 }],
    ["a huge price", { ...mine, monthlyPrice: 5000 }],
    ["a price as text", { ...mine, monthlyPrice: "25" }],
    ["an unknown currency", { ...mine, currency: "BTC" }],
    ["an empty plan", { ...mine, plan: "" }],
    ["an extra field", { ...mine, note: "hi" }],
    ["a missing field", { uid: "alice", placeId: "osm-node-42", plan: "Basic", monthlyPrice: 25, currency: "USD" }],
  ])("rejects %s", async (_name, data) => {
    await assertFails(send(alice(), "alice", data, "alice_osm-node-42"));
  });
});
