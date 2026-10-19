import { describe, expect, it } from "vitest";

import type { LoggedExercise, WorkoutLog } from "@/lib/strength";
import { exerciseTrend, trendExercises, volumeBuckets } from "./progress";

// Dates are built in local time, so these pass in any time zone.
const local = (y: number, m: number, d: number, h = 18) => new Date(y, m, d, h).toISOString();

const bench = (weight: number, reps: number, unit: "kg" | "lb" = "lb"): LoggedExercise => ({
  exerciseId: "barbell-bench-press",
  exerciseName: "Barbell bench press",
  sets: [{ weight, reps, unit, done: true }],
});

function log(id: string, endedAt: string, exercises: LoggedExercise[]): WorkoutLog {
  return {
    id,
    schemaVersion: 1,
    startedAt: endedAt,
    endedAt,
    updatedAt: endedAt,
    exercises,
    exerciseIds: exercises.map((e) => e.exerciseId),
    totals: { sets: 0, reps: 0, volume: 0, unit: "lb" },
  };
}

// Thursday, Oct 15 2026.
const NOW = new Date(2026, 9, 15, 12);

describe("volumeBuckets", () => {
  it("splits this week into Monday to Sunday", () => {
    const logs = [
      log("a", local(2026, 9, 11), [bench(100, 10)]), // Sunday before: excluded
      log("b", local(2026, 9, 13), [bench(100, 10)]), // Tuesday
      log("c", local(2026, 9, 13, 20), [bench(50, 10)]), // Tuesday again
      log("d", local(2026, 9, 18, 23), [bench(10, 1)]), // Sunday
      log("e", local(2026, 9, 19, 0), [bench(10, 1)]), // next Monday: excluded
    ];
    const buckets = volumeBuckets(logs, "week", "lb", NOW);
    expect(buckets.map((b) => b.label)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(buckets.map((b) => b.volume)).toEqual([0, 1500, 0, 0, 0, 0, 10]);
    expect(buckets[1]).toMatchObject({ workouts: 2, longLabel: "Tuesday, Oct 13" });
  });

  it("splits this month into Monday-start weeks that overlap it", () => {
    // October 2026 starts on a Thursday; its weeks start Sep 28 .. Oct 26.
    const buckets = volumeBuckets([log("a", local(2026, 8, 29), [bench(100, 1)])], "month", "lb", NOW);
    expect(buckets.map((b) => b.label)).toEqual(["Sep 28", "Oct 5", "Oct 12", "Oct 19", "Oct 26"]);
    expect(buckets[0]).toMatchObject({ volume: 100, longLabel: "Week of Sep 28" });
  });

  it("splits this year into months and converts units", () => {
    const logs = [
      log("a", local(2026, 0, 3), [bench(100, 1, "kg")]),
      log("b", local(2025, 11, 31), [bench(100, 1)]), // last year: excluded
    ];
    const buckets = volumeBuckets(logs, "year", "lb", NOW);
    expect(buckets).toHaveLength(12);
    expect(buckets[0]).toMatchObject({ label: "Jan", longLabel: "January", volume: 220.5, workouts: 1 });
    expect(buckets.slice(1).every((b) => b.volume === 0)).toBe(true);
  });
});

describe("exerciseTrend", () => {
  it("takes each workout's heaviest finished set, oldest first, in the chosen unit", () => {
    const heavyButUnfinished: LoggedExercise = {
      ...bench(0, 0),
      sets: [
        { weight: 135, reps: 5, unit: "lb", done: true },
        { weight: 300, reps: 1, unit: "lb", done: false },
      ],
    };
    const logs = [
      log("late", local(2026, 9, 14), [bench(70, 5, "kg")]),
      log("early", local(2026, 9, 1), [heavyButUnfinished]),
      log("none", local(2026, 9, 7), []),
    ];
    expect(exerciseTrend(logs, "barbell-bench-press", "lb")).toEqual([
      { logId: "early", endedAt: local(2026, 9, 1), weight: 135 },
      { logId: "late", endedAt: local(2026, 9, 14), weight: 154.3 },
    ]);
  });
});

describe("trendExercises", () => {
  it("lists exercises with finished sets, most-logged first", () => {
    const curl: LoggedExercise = {
      exerciseId: "hammer-curl",
      exerciseName: "Hammer curl",
      sets: [{ weight: 30, reps: 10, unit: "lb", done: true }],
    };
    const logs = [
      log("a", local(2026, 9, 1), [bench(100, 5), bench(100, 5)]),
      log("b", local(2026, 9, 2), [bench(100, 5), curl]),
    ];
    expect(trendExercises(logs)).toEqual([
      { exerciseId: "barbell-bench-press", exerciseName: "Barbell bench press", workouts: 2 },
      { exerciseId: "hammer-curl", exerciseName: "Hammer curl", workouts: 1 },
    ]);
  });
});
