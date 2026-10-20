import { describe, expect, it } from "vitest";

import { workoutTotals, type WorkoutLog } from "@/lib/strength";
import type { HistoryItem } from "./history-merge";
import { summarizeWeek, weekStreak } from "./week-stats";

function log(id: string, weight: number, unit: "kg" | "lb"): WorkoutLog {
  const exercises = [
    { exerciseId: "deadlift", exerciseName: "Deadlift", sets: [{ reps: 5, weight, unit, done: true }] },
  ];
  return {
    id,
    schemaVersion: 1,
    startedAt: "2026-10-16T10:00:00.000Z",
    endedAt: "2026-10-16T11:00:00.000Z",
    updatedAt: "2026-10-16T11:00:00.000Z",
    exercises,
    exerciseIds: ["deadlift"],
    totals: workoutTotals(exercises, unit),
  };
}

describe("summarizeWeek", () => {
  const items: HistoryItem[] = [
    { id: "a", status: "synced", log: log("a", 100, "kg") },
    { id: "b", status: "pending", log: log("b", 225, "lb") },
    { id: "c", status: "failed", log: log("c", 500, "lb"), errorCode: "permission-denied" },
    { id: "d", status: "synced", problem: "unsupported" },
  ];

  it("counts synced and pending workouts, not failed or unreadable ones", () => {
    expect(summarizeWeek(items, "lb")).toMatchObject({ workouts: 2, sets: 2 });
  });

  it("matches the per-workout totals History shows", () => {
    const stats = summarizeWeek(items, "lb");
    const history = workoutTotals(log("a", 100, "kg").exercises, "lb").volume +
      workoutTotals(log("b", 225, "lb").exercises, "lb").volume;
    expect(stats.volume).toBeCloseTo(history, 0);
    expect(stats.volume).toBe(2227.3); // 500 kg → 1102.3 lb, plus 1125 lb
  });

  it("is zero for an empty week", () => {
    expect(summarizeWeek([], "kg")).toEqual({ workouts: 0, sets: 0, volume: 0, unit: "kg" });
  });
});

describe("weekStreak", () => {
  // Built in local time, so these pass in any time zone. Oct 15 2026 is a Thursday.
  const at = (m: number, d: number) => new Date(2026, m, d, 18).toISOString();
  const now = new Date(2026, 9, 15, 12);

  it("counts weeks in a row with a workout, ending this week", () => {
    expect(weekStreak([at(9, 13), at(9, 6), at(9, 1), at(8, 15)], now)).toBe(3);
  });

  it("keeps last week's streak alive while this week has none yet", () => {
    expect(weekStreak([at(9, 6), at(8, 29)], now)).toBe(2);
  });

  it("is 0 after a missed week, or with no workouts", () => {
    expect(weekStreak([at(8, 22)], now)).toBe(0);
    expect(weekStreak([], now)).toBe(0);
  });
});
