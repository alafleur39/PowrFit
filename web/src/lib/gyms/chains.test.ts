import { describe, expect, it } from "vitest";

import { CHAIN_SOURCE, chainPrices, withChainPrices } from "./chains";
import type { Gym, GymPrices } from "./gyms";
import { rankGyms } from "./rank";

const gym = (placeId: string, name: string, country: string | null = "us"): Gym => ({
  placeId,
  name,
  lat: 40.66,
  lon: -73.71,
  ...(country && { country }),
});

describe("chain prices", () => {
  it("knows chains by name, however the map spells them", () => {
    expect(chainPrices(gym("osm-node-1", "Planet Fitness"))?.name).toBe("Planet Fitness");
    expect(chainPrices(gym("osm-node-2", "PLANET FITNESS - Valley Stream"))?.name).toBe("Planet Fitness");
    expect(chainPrices(gym("osm-node-3", "L.A. Fitness"))?.name).toBe("LA Fitness");
    expect(chainPrices(gym("osm-node-4", "Crunch Fitness - Lynbrook"))?.name).toBe("Crunch Fitness");
    expect(chainPrices(gym("osm-node-5", "Blink Fitness"))?.name).toBe("Blink Fitness");
  });

  it("leaves independent gyms, look-alike names and other countries alone", () => {
    expect(chainPrices(gym("osm-node-1", "Iron Den"))).toBeNull();
    expect(chainPrices(gym("osm-node-2", "Crunchtime Boxing"))).toBeNull();
    expect(chainPrices(gym("osm-node-3", "Planet Fitness", "ca"))).toBeNull();
    expect(chainPrices(gym("osm-node-4", "Planet Fitness", null))).toBeNull();
  });

  it("gives US dollar plans marked as a chain price", () => {
    const prices = chainPrices(gym("osm-node-1", "Planet Fitness"));
    expect(prices?.source).toBe(CHAIN_SOURCE);
    expect(prices?.plans.every((plan) => plan.currency === "USD" && plan.monthlyPrice > 0)).toBe(true);
  });

  it("never replaces a price you approved for that gym", () => {
    const approved: GymPrices = {
      name: "Planet Fitness",
      plans: [{ name: "Classic", monthlyPrice: 10, currency: "USD" }],
      source: "user report",
      checkedAt: "2026-11-01",
    };
    const gyms = [gym("osm-node-1", "Planet Fitness"), gym("osm-node-2", "Planet Fitness"), gym("osm-node-3", "Iron Den")];
    const prices = withChainPrices(gyms, new Map([["osm-node-1", approved]]));
    expect(prices.get("osm-node-1")).toBe(approved);
    expect(prices.get("osm-node-2")?.source).toBe(CHAIN_SOURCE);
    expect(prices.has("osm-node-3")).toBe(false);
  });

  it("ranks chain prices with the rest, marked as chain prices", () => {
    const gyms = [gym("osm-node-1", "Planet Fitness"), gym("osm-node-2", "Iron Den")];
    const [first, second] = rankGyms(gyms, withChainPrices(gyms, new Map()), { lat: 40.66, lon: -73.71 }, { sort: "price" });
    expect(first.gym.name).toBe("Planet Fitness");
    expect(first.cheapest?.monthlyPrice).toBe(15);
    expect(first.chainPrice).toBe(true);
    expect(second.chainPrice).toBeUndefined();
  });
});
