// Display and input helpers shared by the logger, summary, history and home.
// Pure and tested, so every screen formats the same numbers the same way.

import {
  convertWeight,
  isCardioSet,
  roundWeight,
  type CardioSet,
  type LoggedSet,
  type WeightUnit,
} from "@/lib/strength";

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

/** "135 × 6, 135 × 5" with each set converted to `unit`; cardio sets as formatCardioSet. */
export function formatSetsLine(sets: readonly LoggedSet[], unit: WeightUnit): string {
  return sets
    .map((set) => {
      if (isCardioSet(set)) return formatCardioSet(set);
      const weight = roundWeight(convertWeight(set.weight, set.unit, unit), unit);
      return `${numberFormat.format(weight)} × ${set.reps}`;
    })
    .join(", ");
}

/** " · 25 min cardio" after a sets-and-volume line, or "" with no cardio. */
export function formatCardioSuffix(cardioSec: number): string {
  return cardioSec > 0 ? ` · ${formatCardioMinutes(cardioSec)} cardio` : "";
}

/** A cardio time: "20:00", "45:30", "1:05:00". */
export function formatCardioTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const two = (n: number) => String(n).padStart(2, "0");
  const rest = two(seconds % 60);
  return hours > 0 ? `${hours}:${two(minutes)}:${rest}` : `${minutes}:${rest}`;
}

/** Total cardio time for summaries: "25 min", "1 h 5 min". Rounded to the minute. */
export function formatCardioMinutes(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest === 0 ? `${Math.floor(minutes / 60)} h` : `${Math.floor(minutes / 60)} h ${rest} min`;
}

/** "20:00 · 1.5 mi · level 8 · 120 floors · 3% incline · 150 cal", leaving out what wasn't entered. */
export function formatCardioSet(set: CardioSet): string {
  const parts = [formatCardioTime(set.durationSec)];
  if (set.distance !== undefined) parts.push(`${numberFormat.format(set.distance)} ${set.distanceUnit}`);
  if (set.level !== undefined) parts.push(`level ${numberFormat.format(set.level)}`);
  if (set.floors !== undefined) parts.push(plural(set.floors, "floor"));
  if (set.inclinePct !== undefined) parts.push(`${numberFormat.format(set.inclinePct)}% incline`);
  if (set.calories !== undefined) parts.push(`${set.calories} cal`);
  return parts.join(" · ");
}

/**
 * Parses a cardio time. A plain number is minutes ("20", "12.5"); "20:30" is
 * minutes and seconds and "1:05:00" adds hours. "" is null; junk, 0 and
 * more than 24 hours are undefined.
 */
export function parseDurationInput(text: string): number | null | undefined {
  const trimmed = text.trim().replace(",", ".");
  if (trimmed === "") return null;
  let seconds: number;
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    seconds = Math.round(Number(trimmed) * 60);
  } else if (/^\d+(:[0-5]\d){1,2}$/.test(trimmed)) {
    seconds = trimmed.split(":").reduce((total, part) => total * 60 + Number(part), 0);
  } else {
    return undefined;
  }
  return seconds >= 1 && seconds <= 24 * 3600 ? seconds : undefined;
}

/** Parses an optional decimal stat (distance, level, incline) up to `max`. */
export function parseDecimalInput(text: string, max: number): number | null | undefined {
  const value = parseWeightInput(text);
  return value === null || value === undefined ? value : value <= max ? value : undefined;
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
