// Training signals for suggested videos (Phase 6, P6-01, decision D37).
//
// Pure, like records.ts: reads the user's history and returns topics worth a
// video, each with the reason it was picked. It runs on the phone, so no
// workout data leaves the device; only a topic's search words do, when the
// user opens a video.

import { EXERCISES } from "./exercises";
import { convertWeight } from "./units";
import type { MuscleGroup, WorkoutLog } from "./types";

export type SuggestionKind = "comeback" | "plateau" | "new-exercise" | "balance" | "beginner";

export type Suggestion = {
  kind: SuggestionKind;
  /** Stable id, also the key into the curated video library (P6-03). */
  topic: string;
  /** Short title: "Break a Barbell bench press plateau". */
  title: string;
  /** Why it was picked, in the user's terms. */
  reason: string;
  /** Words for a YouTube search when the library has no pick. */
  query: string;
};

const DAY = 24 * 60 * 60 * 1000;
/** Days without a workout before suggesting a comeback. */
export const COMEBACK_DAYS = 10;
/** Weeks a lift's top set must stay flat to count as a plateau. */
export const PLATEAU_WEEKS = 4;
/** Fewer finished workouts than this counts as just starting. */
export const BEGINNER_WORKOUTS = 5;

const PUSH: readonly MuscleGroup[] = ["chest", "shoulders", "triceps"];
const PULL: readonly MuscleGroup[] = ["back", "biceps"];
const MUSCLE = new Map(EXERCISES.map((exercise) => [exercise.id, exercise.primaryMuscle]));

const time = (iso: string) => Date.parse(iso);
const lower = (name: string) => name.charAt(0).toLowerCase() + name.slice(1);

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Heaviest finished set of `exerciseId` in one workout, in kg; undefined if not done. */
function topSetKg(log: WorkoutLog, exerciseId: string): number | undefined {
  let best: number | undefined;
  for (const exercise of log.exercises) {
    if (exercise.exerciseId !== exerciseId) continue;
    for (const set of exercise.sets) {
      if (!set.done) continue;
      const kg = convertWeight(set.weight, set.unit, "kg");
      if (best === undefined || kg > best) best = kg;
    }
  }
  return best;
}

function comeback(logs: readonly WorkoutLog[], now: number): Suggestion | null {
  const last = logs[0];
  if (!last) return null;
  const days = Math.floor((now - time(last.endedAt)) / DAY);
  if (days < COMEBACK_DAYS) return null;
  return {
    kind: "comeback",
    topic: "comeback",
    title: "Ease back into training",
    reason: `Your last workout was ${days} days ago`,
    query: "how to get back into lifting after a break",
  };
}

/**
 * A lift whose best top set in the last PLATEAU_WEEKS hasn't beaten the
 * best from before, with at least two recent workouts of it.
 */
function plateaus(logs: readonly WorkoutLog[], now: number): Suggestion[] {
  const cutoff = now - PLATEAU_WEEKS * 7 * DAY;
  const result: Suggestion[] = [];
  const ids = [...new Set(logs.flatMap((log) => log.exerciseIds))];
  for (const id of ids) {
    let recentBest: number | undefined;
    let recentCount = 0;
    let earlierBest: number | undefined;
    let earlierBestAt = "";
    let name = id;
    for (const log of logs) {
      const kg = topSetKg(log, id);
      if (kg === undefined || kg === 0) continue;
      name = log.exercises.find((exercise) => exercise.exerciseId === id)?.exerciseName ?? name;
      if (time(log.endedAt) >= cutoff) {
        recentCount += 1;
        recentBest = Math.max(recentBest ?? 0, kg);
      } else if (earlierBest === undefined || kg > earlierBest) {
        earlierBest = kg;
        earlierBestAt = log.endedAt;
      }
    }
    if (recentCount < 2 || recentBest === undefined || earlierBest === undefined) continue;
    if (recentBest > earlierBest + 1e-6) continue;
    result.push({
      kind: "plateau",
      topic: `plateau:${id}`,
      title: `Break your ${lower(name)} plateau`,
      reason: `Your best ${lower(name)} hasn't gone up since ${dateLabel(earlierBestAt)}`,
      query: `how to break a ${lower(name)} plateau`,
    });
  }
  return result;
}

/** Exercises in the latest workout (within two weeks) never done before it. */
function newExercises(logs: readonly WorkoutLog[], now: number): Suggestion[] {
  const [latest, ...earlier] = logs;
  if (!latest || earlier.length === 0 || now - time(latest.endedAt) > 14 * DAY) return [];
  const seen = new Set(earlier.flatMap((log) => log.exerciseIds));
  return latest.exercises
    .filter((exercise, index, all) => !seen.has(exercise.exerciseId) && all.findIndex((e) => e.exerciseId === exercise.exerciseId) === index)
    .map((exercise) => ({
      kind: "new-exercise" as const,
      topic: `form:${exercise.exerciseId}`,
      title: `${exercise.exerciseName} form`,
      reason: `New to ${lower(exercise.exerciseName)}`,
      query: `${lower(exercise.exerciseName)} proper form tutorial`,
    }));
}

/** Push sets at least double pull sets over the last 4 weeks (10+ push sets). */
function balance(logs: readonly WorkoutLog[], now: number): Suggestion | null {
  const cutoff = now - 4 * 7 * DAY;
  let push = 0;
  let pull = 0;
  for (const log of logs) {
    if (time(log.endedAt) < cutoff) continue;
    for (const exercise of log.exercises) {
      const muscle = MUSCLE.get(exercise.exerciseId);
      const sets = exercise.sets.filter((set) => set.done).length;
      if (muscle && PUSH.includes(muscle)) push += sets;
      if (muscle && PULL.includes(muscle)) pull += sets;
    }
  }
  if (push < 10 || push < 2 * pull) return null;
  const ratio = pull === 0 ? "far more" : `${Math.round(push / pull)}x more`;
  return {
    kind: "balance",
    topic: "balance:push-pull",
    title: "Balance pushing and pulling",
    reason: `${ratio.charAt(0).toUpperCase()}${ratio.slice(1)} pushing than pulling in the last 4 weeks`,
    query: "balancing push and pull exercises for shoulder health",
  };
}

function beginner(logs: readonly WorkoutLog[]): Suggestion | null {
  if (logs.length === 0 || logs.length >= BEGINNER_WORKOUTS) return null;
  return {
    kind: "beginner",
    topic: "beginner",
    title: "Strength training basics",
    reason: "You're just getting started",
    query: "beginner strength training program explained",
  };
}

/**
 * Suggestions for the user's history (newest first, as useHistoryLogs gives
 * it), most useful first: comeback, plateaus, new exercises, balance,
 * beginner. At most `limit`.
 */
export function suggestTopics(
  logs: readonly WorkoutLog[],
  now: Date,
  limit = 2
): Suggestion[] {
  const sorted = [...logs].sort((a, b) => b.endedAt.localeCompare(a.endedAt));
  const at = now.getTime();
  const all = [
    comeback(sorted, at),
    ...plateaus(sorted, at),
    ...newExercises(sorted, at),
    balance(sorted, at),
    beginner(sorted),
  ].filter((suggestion): suggestion is Suggestion => suggestion !== null);
  return all.slice(0, limit);
}
