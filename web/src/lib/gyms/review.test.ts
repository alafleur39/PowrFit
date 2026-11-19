import { describe, expect, it } from "vitest";

import { approvedPrices, decodePriceReport, type GymPrices, type StoredPriceReport } from "./gyms";

const stored: StoredPriceReport = {
  id: "alice_osm-node-42",
  uid: "alice",
  placeId: "osm-node-42",
  gymName: "Iron Den",
  plan: "Unlimited",
  monthlyPrice: 29.99,
  currency: "USD",
  createdAt: "2026-11-18T12:00:00.000Z",
};

describe("price review", () => {
  it("reads a stored report with its sender, and refuses broken ones", () => {
    const { id, ...data } = stored;
    expect(decodePriceReport(id, data)).toEqual(stored);
    expect(decodePriceReport(id, { ...data, monthlyPrice: "30" })).toBeNull();
    expect(decodePriceReport(id, { ...data, placeId: "abc" })).toBeNull();
    expect(decodePriceReport(id, { ...data, uid: undefined })).toBeNull();
    expect(decodePriceReport(id, null)).toBeNull();
  });

  it("starts a gym's prices from its first approved report", () => {
    expect(approvedPrices(null, stored, "2026-11-18")).toEqual({
      name: "Iron Den",
      plans: [{ name: "Unlimited", monthlyPrice: 29.99, currency: "USD" }],
      source: "member report",
      checkedAt: "2026-11-18",
    });
  });

  it("replaces a plan of the same name and keeps the others", () => {
    const existing: GymPrices = {
      name: "Iron Den Gym",
      plans: [
        { name: "unlimited", monthlyPrice: 25, currency: "USD" },
        { name: "Basic", monthlyPrice: 15, currency: "USD", joiningFee: 49 },
      ],
      source: "gym website",
      checkedAt: "2026-10-01",
    };
    const next = approvedPrices(existing, stored, "2026-11-18");
    expect(next.name).toBe("Iron Den Gym");
    expect(next.plans).toEqual([
      { name: "Unlimited", monthlyPrice: 29.99, currency: "USD" },
      { name: "Basic", monthlyPrice: 15, currency: "USD", joiningFee: 49 },
    ]);
  });
});
