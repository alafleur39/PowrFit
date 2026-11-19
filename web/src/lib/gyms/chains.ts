// Published starting prices for national gym chains (Phase 8, gym prices).
// Pure. Most gyms on the map had no price; chain gyms now show their chain's
// advertised starting price, labelled as a chain price that may vary by
// location. A price you approved for that exact gym always wins.
//
// Matched by the gym's name, US gyms only (the prices are US prices). Update
// CHAINS_CHECKED_AT whenever these numbers are re-checked.

import type { Gym, GymPrices } from "./gyms";

export const CHAIN_SOURCE = "chain price";
export const CHAINS_CHECKED_AT = "2026-11-18";

type Chain = { name: string; match: RegExp; plans: { name: string; monthlyPrice: number }[] };

// Names are compared lowercased, with punctuation turned into spaces.
const CHAINS: readonly Chain[] = [
  {
    name: "Planet Fitness",
    match: /^planet fitness\b/,
    plans: [
      { name: "Classic", monthlyPrice: 15 },
      { name: "Black Card", monthlyPrice: 24.99 },
    ],
  },
  {
    name: "Crunch Fitness",
    match: /^crunch( fitness| gym)?\b/,
    plans: [
      { name: "Base", monthlyPrice: 9.99 },
      { name: "Peak", monthlyPrice: 26.99 },
    ],
  },
  {
    name: "Blink Fitness",
    match: /^blink( fitness)?\b/,
    plans: [{ name: "Blue", monthlyPrice: 17 }],
  },
  {
    name: "LA Fitness",
    match: /^l ?a fitness\b/,
    plans: [{ name: "Single club", monthlyPrice: 39.99 }],
  },
];

const normalise = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** The chain's published prices for this gym, or null for independent and non-US gyms. */
export function chainPrices(gym: Pick<Gym, "name" | "country">): GymPrices | null {
  if (gym.country !== "us") return null;
  const name = normalise(gym.name);
  const chain = CHAINS.find((candidate) => candidate.match.test(name));
  if (!chain) return null;
  return {
    name: chain.name,
    plans: chain.plans.map((plan) => ({ ...plan, currency: "USD" })),
    source: CHAIN_SOURCE,
    checkedAt: CHAINS_CHECKED_AT,
  };
}

/** Approved prices, plus chain prices for the gyms that have none. */
export function withChainPrices(gyms: readonly Gym[], approved: ReadonlyMap<string, GymPrices>): Map<string, GymPrices> {
  const prices = new Map(approved);
  for (const gym of gyms) {
    if (prices.has(gym.placeId)) continue;
    const chain = chainPrices(gym);
    if (chain) prices.set(gym.placeId, chain);
  }
  return prices;
}

export const isChainPrice = (prices: GymPrices | undefined) => prices?.source === CHAIN_SOURCE;
