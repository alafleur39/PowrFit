// Gyms near you (Phase 6, P6-04, decisions D35, D36, D42). Pure: the shapes,
// limits and codecs for gyms, their curated prices and users' price
// reports. The same limits are enforced by firestore.rules.

/** "osm-node-123": the provider and its id for the gym, also the gyms doc id. */
export type PlaceId = string;
const PLACE_ID = /^osm-(node|way|relation)-\d{1,20}$/;

export const CURRENCIES = ["USD", "CAD", "GBP", "EUR", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** A gym from the map provider (OpenStreetMap). */
export type Gym = {
  placeId: PlaceId;
  name: string;
  lat: number;
  lon: number;
  /** "123 Main St", when the map has it. */
  address?: string;
  /** Lowercase ISO country code, "us", when the map has it. */
  country?: string;
};

export type GymPlan = {
  name: string;
  /** Per month, in `currency`. */
  monthlyPrice: number;
  currency: Currency;
  joiningFee?: number;
};

/** gyms/{placeId}: prices you approved (D36). Written by hand, read by the app. */
export type GymPrices = {
  name: string;
  plans: GymPlan[];
  /** Where the price came from: "user report", "gym website". */
  source: string;
  checkedAt: string;
};

/**
 * gymPriceReports/{uid}_{placeId}: "I pay $25 a month here". Records its
 * sender (Nov 2026, replacing D42's anonymous reports) so spam can be traced
 * and banned; only the admin can read reports. One per user per gym.
 */
export type PriceReport = {
  placeId: PlaceId;
  gymName: string;
  plan: string;
  monthlyPrice: number;
  currency: Currency;
  createdAt: string;
};

export const PRICE_LIMITS = { gymName: 100, plan: 60, maxMonthly: 1000 } as const;

export function isPlaceId(value: unknown): value is PlaceId {
  return typeof value === "string" && PLACE_ID.test(value);
}

/** What has to be fixed before a report can be sent; empty when valid. */
export function priceReportProblems(report: Omit<PriceReport, "createdAt">): string[] {
  const problems: string[] = [];
  if (!isPlaceId(report.placeId)) problems.push("Pick a gym from the list.");
  if (report.plan.trim() === "") problems.push("Name the plan, e.g. Basic or Unlimited.");
  if (report.plan.trim().length > PRICE_LIMITS.plan) problems.push("Keep the plan name short.");
  if (!Number.isFinite(report.monthlyPrice) || report.monthlyPrice <= 0 || report.monthlyPrice > PRICE_LIMITS.maxMonthly) {
    problems.push(`Enter a monthly price between 1 and ${PRICE_LIMITS.maxMonthly}.`);
  }
  if (!(CURRENCIES as readonly string[]).includes(report.currency)) problems.push("Pick a currency.");
  return problems;
}

/** The report's id: one per user per gym, so sending again corrects it. */
export function priceReportId(uid: string, placeId: PlaceId): string {
  return `${uid}_${placeId}`;
}

export function encodePriceReport(uid: string, report: PriceReport): Record<string, unknown> {
  return {
    uid,
    placeId: report.placeId,
    gymName: report.gymName.trim().slice(0, PRICE_LIMITS.gymName),
    plan: report.plan.trim(),
    monthlyPrice: Math.round(report.monthlyPrice * 100) / 100,
    currency: report.currency,
    createdAt: report.createdAt,
  };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function decodePlan(value: unknown): GymPlan | null {
  if (!isObject(value)) return null;
  const { name, monthlyPrice, currency, joiningFee } = value;
  if (typeof name !== "string" || typeof monthlyPrice !== "number" || !Number.isFinite(monthlyPrice) || monthlyPrice < 0) return null;
  if (!(CURRENCIES as readonly unknown[]).includes(currency)) return null;
  if (joiningFee !== undefined && (typeof joiningFee !== "number" || joiningFee < 0)) return null;
  return {
    name,
    monthlyPrice,
    currency: currency as Currency,
    ...(joiningFee !== undefined && { joiningFee: joiningFee as number }),
  };
}

/** A gyms/{placeId} document, or null when it's unreadable. Bad plans are skipped. */
export function decodeGymPrices(data: unknown): GymPrices | null {
  if (!isObject(data)) return null;
  const { name, plans, source, checkedAt } = data;
  if (typeof name !== "string" || !Array.isArray(plans)) return null;
  return {
    name,
    plans: plans.map(decodePlan).filter((plan): plan is GymPlan => plan !== null),
    source: typeof source === "string" ? source : "",
    checkedAt: typeof checkedAt === "string" ? checkedAt : "",
  };
}

/** The cheapest monthly plan, or undefined when no price is known. */
export function cheapestPlan(prices: GymPrices | undefined): GymPlan | undefined {
  return prices?.plans.reduce<GymPlan | undefined>(
    (best, plan) => (!best || plan.monthlyPrice < best.monthlyPrice ? plan : best),
    undefined
  );
}

// Price review (Phase 8): the admin approves, rejects or bans from reports.

/** A stored report, with its id and sender, as the admin reads it. */
export type StoredPriceReport = PriceReport & { id: string; uid: string };

/** A gymPriceReports document, or null when it's unreadable. */
export function decodePriceReport(id: string, data: unknown): StoredPriceReport | null {
  if (!isObject(data)) return null;
  const { uid, placeId, gymName, plan, monthlyPrice, currency, createdAt } = data;
  if (typeof uid !== "string" || !isPlaceId(placeId) || typeof gymName !== "string" || typeof plan !== "string") return null;
  if (typeof monthlyPrice !== "number" || !Number.isFinite(monthlyPrice) || monthlyPrice <= 0) return null;
  if (!(CURRENCIES as readonly unknown[]).includes(currency)) return null;
  return {
    id,
    uid,
    placeId,
    gymName,
    plan,
    monthlyPrice,
    currency: currency as Currency,
    createdAt: typeof createdAt === "string" ? createdAt : "",
  };
}

export const MEMBER_REPORT_SOURCE = "member report";
const MAX_PLANS = 10;

/**
 * The gym's prices once this report is approved: the reported plan replaces
 * one of the same name (any case), other plans stay, newest first.
 */
export function approvedPrices(existing: GymPrices | null, report: StoredPriceReport, today: string): GymPrices {
  const plan: GymPlan = { name: report.plan.trim(), monthlyPrice: report.monthlyPrice, currency: report.currency };
  const others = (existing?.plans ?? []).filter((old) => old.name.trim().toLowerCase() !== plan.name.toLowerCase());
  return {
    name: existing?.name || report.gymName.trim().slice(0, PRICE_LIMITS.gymName) || "Gym",
    plans: [plan, ...others].slice(0, MAX_PLANS),
    source: MEMBER_REPORT_SOURCE,
    checkedAt: today,
  };
}

// Reporting a price (Phase 8, App Review guideline 1.2): any member can flag
// a member-sent price as wrong or offensive. The flag goes to the admin's
// review screen; nobody else can read it.

/** priceFlags/{uid}_{placeId}: "this price looks wrong". One per user per gym. */
export type PriceFlag = { placeId: PlaceId; gymName: string; createdAt: string };
export type StoredPriceFlag = PriceFlag & { id: string; uid: string };

export function encodePriceFlag(uid: string, flag: PriceFlag): Record<string, unknown> {
  return {
    uid,
    placeId: flag.placeId,
    gymName: flag.gymName.trim().slice(0, PRICE_LIMITS.gymName),
    createdAt: flag.createdAt,
  };
}

/** A priceFlags document, or null when it's unreadable. */
export function decodePriceFlag(id: string, data: unknown): StoredPriceFlag | null {
  if (!isObject(data)) return null;
  const { uid, placeId, gymName, createdAt } = data;
  if (typeof uid !== "string" || !isPlaceId(placeId) || typeof gymName !== "string") return null;
  return { id, uid, placeId, gymName, createdAt: typeof createdAt === "string" ? createdAt : "" };
}
