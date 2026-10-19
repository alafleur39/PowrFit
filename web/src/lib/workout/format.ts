// Display and input helpers shared by the logger, summary, history and home.
// Pure and tested, so every screen formats the same numbers the same way.

import { convertWeight, roundWeight, type LoggedSet, type WeightUnit } from "@/lib/strength";

/** "12:34" under an hour, "1:02:03" after. */
export function formatElapsed(startIso: string, nowMs: number): string {
  const total = Math.max(0, Math.floor((nowMs - Date.parse(startIso)) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${minutes}:${two(seconds)}`;
}

/** Whole minutes between two ISO times, e.g. "36 min" or "1 h 5 min". */
export function formatDuration(startIso: string, endIso: string): string {
  const minutes = Math.max(0, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest === 0 ? `${Math.floor(minutes / 60)} h` : `${Math.floor(minutes / 60)} h ${rest} min`;
}

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

/** "135 lb", "62.5 kg", "3,824.6 lb". The value is already in `unit`. */
export function formatWeight(value: number, unit: WeightUnit): string {
  return `${formatWeightAmount(value, unit)} ${unit}`;
}

/** "1,140": the number formatWeight shows, without the unit. */
export function formatWeightAmount(value: number, unit: WeightUnit): string {
  return numberFormat.format(roundWeight(value, unit));
}

/** "1 set", "3 sets". */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "135 × 6, 135 × 5" with each set converted to `unit`. */
export function formatSetsLine(sets: readonly LoggedSet[], unit: WeightUnit): string {
  return sets
    .map((set) => {
      const weight = roundWeight(convertWeight(set.weight, set.unit, unit), unit);
      return `${numberFormat.format(weight)} × ${set.reps}`;
    })
    .join(", ");
}

/**
 * Parses a weight field. "" is null (still empty); "62,5" is accepted for
 * comma-decimal keyboards. Returns undefined when the text isn't a valid
 * non-negative number, so the field can show an error instead of guessing.
 */
export function parseWeightInput(text: string): number | null | undefined {
  const trimmed = text.trim().replace(",", ".");
  if (trimmed === "") return null;
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(trimmed)) return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) && value <= 2000 ? value : undefined;
}

/** Parses a reps field: whole numbers only, "" is null, junk is undefined. */
export function parseRepsInput(text: string): number | null | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  if (!/^\d+$/.test(trimmed)) return undefined;
  const value = Number(trimmed);
  return value <= 1000 ? value : undefined;
}

/** Monday 00:00 local time of the week containing `date`. */
export function weekStart(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

/** "Fri, Oct 16" in the device's time zone. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
