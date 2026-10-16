// Weight-unit conversion and rounding (P1-04).
//
// Sets are stored in the unit they were entered in (see LoggedSet), so these
// helpers run whenever we total or display weights in another unit.
// convertWeight is exact; call roundWeight once at the end, not after every
// step, so mixed-unit totals don't pile up rounding error.

import type { WeightUnit } from "./types";

/** International avoirdupois pound, exact by definition. */
export const KG_PER_LB = 0.45359237;

/** Smallest weight step we store and display (decision D5). */
export const WEIGHT_STEP: Record<WeightUnit, number> = {
  kg: 0.1,
  lb: 0.1,
};

function assertValidWeight(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`Invalid weight: ${value}`);
  }
}

/** Converts `value` from one unit to another without rounding. */
export function convertWeight(
  value: number,
  from: WeightUnit,
  to: WeightUnit
): number {
  assertValidWeight(value);
  if (from === to) return value;
  return from === "lb" ? value * KG_PER_LB : value / KG_PER_LB;
}

/** Rounds `value` to the nearest step for `unit`, e.g. 220.46 lb → 220.5. */
export function roundWeight(value: number, unit: WeightUnit): number {
  assertValidWeight(value);
  const step = WEIGHT_STEP[unit];
  const rounded = Math.round(value / step) * step;
  // Strip float noise such as 220.50000000000003.
  return Number(rounded.toFixed(decimalPlaces(step)));
}

function decimalPlaces(step: number): number {
  const [, fraction = ""] = String(step).split(".");
  return fraction.length;
}
