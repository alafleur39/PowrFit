import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

// P6-04: gyms (shared, read-only) and gymPriceReports (create-only,
// anonymous). The first data in PowrFit that isn't private to one user,
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

describe("gymPriceReports", () => {
  it("lets a signed-in user send a report, and nothing else", async () => {
    await assertSucceeds(alice().collection("gymPriceReports").add(report));
    await assertFails(guest().collection("gymPriceReports").add(report));
    await assertFails(alice().doc("gymPriceReports/r1").get());
    await assertFails(bob().collection("gymPriceReports").get());
    await assertFails(alice().collectionGroup("gymPriceReports").get());
    await assertFails(alice().doc("gymPriceReports/r1").set({ ...report, monthlyPrice: 1 }));
    await assertFails(alice().doc("gymPriceReports/r1").delete());
  });

  it.each([
    ["a reporter id (reports are anonymous)", { ...report, reporterUid: "alice" }],
    ["a bad place id", { ...report, placeId: "../users/alice" }],
    ["a zero price", { ...report, monthlyPrice: 0 }],
    ["a huge price", { ...report, monthlyPrice: 5000 }],
    ["a price as text", { ...report, monthlyPrice: "25" }],
    ["an unknown currency", { ...report, currency: "BTC" }],
    ["an empty plan", { ...report, plan: "" }],
    ["a missing field", { placeId: "osm-node-42", plan: "Basic", monthlyPrice: 25, currency: "USD" }],
  ])("rejects %s", async (_name, data) => {
    await assertFails(alice().collection("gymPriceReports").add(data));
  });
});
