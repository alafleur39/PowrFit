import { describe, expect, it } from "vitest";

import { cheapestPlan, decodeGymPrices, encodePriceReport, isPlaceId, priceReportProblems } from "./gyms";

const report = { placeId: "osm-node-42", gymName: "Iron Den", plan: "Basic", monthlyPrice: 24.999, currency: "USD" as const };

describe("gyms", () => {
  it("accepts only provider place ids", () => {
    expect(isPlaceId("osm-node-42")).toBe(true);
    expect(isPlaceId("osm-way-7")).toBe(true);
    expect(isPlaceId("node-42")).toBe(false);
    expect(isPlaceId("osm-node-../../x")).toBe(false);
  });

  it("checks a price report", () => {
    expect(priceReportProblems(report)).toEqual([]);
    expect(priceReportProblems({ ...report, plan: " ", monthlyPrice: 0 })).toEqual([
      "Name the plan, e.g. Basic or Unlimited.",
      "Enter a monthly price between 1 and 1000.",
    ]);
  });

  it("encodes a report without anything about the reporter", () => {
    expect(encodePriceReport({ ...report, createdAt: "2026-10-19T00:00:00.000Z" })).toEqual({
      placeId: "osm-node-42",
      gymName: "Iron Den",
      plan: "Basic",
      monthlyPrice: 25,
      currency: "USD",
      createdAt: "2026-10-19T00:00:00.000Z",
    });
  });

  it("decodes curated prices, skipping bad plans, and finds the cheapest", () => {
    const prices = decodeGymPrices({
      name: "Iron Den",
      plans: [
        { name: "Unlimited", monthlyPrice: 40, currency: "USD", joiningFee: 10 },
        { name: "Basic", monthlyPrice: 25, currency: "USD" },
        { name: "Broken", monthlyPrice: "cheap", currency: "USD" },
      ],
      source: "gym website",
      checkedAt: "2026-10-19",
    });
    expect(prices?.plans).toHaveLength(2);
    expect(cheapestPlan(prices ?? undefined)?.name).toBe("Basic");
    expect(cheapestPlan(undefined)).toBeUndefined();
    expect(decodeGymPrices({ plans: [] })).toBeNull();
  });
});
