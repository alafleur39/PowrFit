// Orders gyms for the gyms screen (P6-06). Pure: distance is worked out on
// the phone from its own position, which never leaves the device (D35).

import { cheapestPlan, type Gym, type GymPlan, type GymPrices } from "./gyms";

export type GymSort = "price" | "distance";

export type RankedGym = {
  gym: Gym;
  /** Straight-line distance from where the search was made. */
  distanceKm: number;
  /** The cheapest approved plan, when a price is known. */
  cheapest?: GymPlan;
};

const EARTH_RADIUS_KM = 6371;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance between two points, in km. */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = radians(b.lat - a.lat);
  const dLon = radians(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Gyms in the order the screen shows them. By price: gyms with a known
 * price, cheapest first, then the rest nearest first. By distance: nearest
 * first. A budget hides gyms known to cost more; gyms without a price stay,
 * since they may fit it.
 */
export function rankGyms(
  gyms: readonly Gym[],
  prices: ReadonlyMap<string, GymPrices>,
  origin: { lat: number; lon: number },
  { sort, maxMonthly }: { sort: GymSort; maxMonthly?: number }
): RankedGym[] {
  const ranked = gyms
    .map((gym): RankedGym => {
      const cheapest = cheapestPlan(prices.get(gym.placeId));
      return { gym, distanceKm: distanceKm(origin, gym), ...(cheapest && { cheapest }) };
    })
    .filter((item) => maxMonthly === undefined || !item.cheapest || item.cheapest.monthlyPrice <= maxMonthly);

  return ranked.sort((a, b) => {
    if (sort === "price") {
      if (a.cheapest && !b.cheapest) return -1;
      if (!a.cheapest && b.cheapest) return 1;
      if (a.cheapest && b.cheapest && a.cheapest.monthlyPrice !== b.cheapest.monthlyPrice) {
        return a.cheapest.monthlyPrice - b.cheapest.monthlyPrice;
      }
    }
    return a.distanceKm - b.distanceKm || a.gym.name.localeCompare(b.gym.name);
  });
}

/** "350 m", "1.4 km", "12 km"; miles for imperial users: "0.9 mi". */
export function formatDistance(km: number, unit: "kg" | "lb"): string {
  if (unit === "lb") {
    const miles = km / 1.609344;
    return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
  }
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

const SYMBOLS: Record<GymPlan["currency"], string> = { USD: "$", CAD: "CA$", GBP: "£", EUR: "€", AUD: "A$" };

/** "$25/mo", "£19.99/mo". */
export function formatMonthly(plan: Pick<GymPlan, "monthlyPrice" | "currency">): string {
  const amount = Number.isInteger(plan.monthlyPrice) ? String(plan.monthlyPrice) : plan.monthlyPrice.toFixed(2);
  return `${SYMBOLS[plan.currency]}${amount}/mo`;
}
