import { describe, expect, it } from "vitest";

import type { Gym, GymPrices } from "./gyms";
import { distanceKm, formatDistance, formatMonthly, rankGyms } from "./rank";

const HERE = { lat: 40.758, lon: -73.9855 };
const gym = (placeId: string, name: string, northKm: number): Gym => ({
  placeId,
  name,
  lat: HERE.lat + northKm / 111.2,
  lon: HERE.lon,
});
const priced = (monthlyPrice: number): GymPrices => ({
  name: "",
  plans: [
    { name: "Premium", monthlyPrice: monthlyPrice + 20, currency: "USD" },
    { name: "Basic", monthlyPrice, currency: "USD" },
  ],
  source: "user report",
  checkedAt: "2026-10-20",
});

const near = gym("osm-node-1", "Near Gym", 0.5);
const mid = gym("osm-node-2", "Mid Gym", 2);
const far = gym("osm-node-3", "Far Gym", 4);
const prices = new Map([
  ["osm-node-2", priced(40)],
  ["osm-node-3", priced(15)],
]);
const names = (list: ReturnType<typeof rankGyms>) => list.map((item) => item.gym.name);

describe("distanceKm", () => {
  it("measures great-circle distance", () => {
    expect(distanceKm(HERE, HERE)).toBe(0);
    expect(distanceKm(HERE, gym("osm-node-9", "x", 2))).toBeCloseTo(2, 1);
  });
});

describe("rankGyms", () => {
  it("by price: cheapest known price first, then unpriced gyms nearest first", () => {
    const ranked = rankGyms([near, mid, far], prices, HERE, { sort: "price" });
    expect(names(ranked)).toEqual(["Far Gym", "Mid Gym", "Near Gym"]);
    expect(ranked[0].cheapest).toMatchObject({ name: "Basic", monthlyPrice: 15 });
    expect(ranked[2].cheapest).toBeUndefined();
  });

  it("by distance: nearest first", () => {
    expect(names(rankGyms([far, near, mid], prices, HERE, { sort: "distance" }))).toEqual([
      "Near Gym",
      "Mid Gym",
      "Far Gym",
    ]);
  });

  it("a budget hides gyms known to cost more, and keeps gyms without a price", () => {
    expect(names(rankGyms([near, mid, far], prices, HERE, { sort: "price", maxMonthly: 30 }))).toEqual([
      "Far Gym",
      "Near Gym",
    ]);
  });
});

describe("formatting", () => {
  it("formats distance in km or miles", () => {
    expect(formatDistance(0.347, "kg")).toBe("350 m");
    expect(formatDistance(1.44, "kg")).toBe("1.4 km");
    expect(formatDistance(12.4, "kg")).toBe("12 km");
    expect(formatDistance(1.609344, "lb")).toBe("1.0 mi");
  });

  it("formats a monthly price", () => {
    expect(formatMonthly({ monthlyPrice: 25, currency: "USD" })).toBe("$25/mo");
    expect(formatMonthly({ monthlyPrice: 19.99, currency: "GBP" })).toBe("£19.99/mo");
  });
});
