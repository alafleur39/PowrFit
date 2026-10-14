import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_PROGRESS,
  applyWorkoutLog,
  clamp,
  formatDelta,
  percentOfGoal,
  type LogWorkoutInput,
  type UserProgress,
  type WorkoutSession,
} from "@/lib/training-data";

describe("clamp", () => {
  it("returns min when below the range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("returns max when above the range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("returns the value when inside the range", () => {
    expect(clamp(7, 0, 10)).toBe(7);
  });
});

describe("percentOfGoal", () => {
  it("returns 0 when the goal is zero or negative", () => {
    expect(percentOfGoal(100, 0)).toBe(0);
    expect(percentOfGoal(100, -5)).toBe(0);
  });

  it("returns a rounded percentage", () => {
    expect(percentOfGoal(150, 300)).toBe(50);
    expect(percentOfGoal(1, 3)).toBe(33);
  });

  it("clamps to 0–100", () => {
    expect(percentOfGoal(500, 300)).toBe(100);
    expect(percentOfGoal(-10, 300)).toBe(0);
  });
});

describe("formatDelta", () => {
  it("returns undefined without a previous value", () => {
    expect(formatDelta(10)).toBeUndefined();
  });

  it("returns undefined when the rounded difference is zero", () => {
    expect(formatDelta(10, 10)).toBeUndefined();
    expect(formatDelta(10.4, 10)).toBeUndefined();
  });

  it("formats signed differences with an optional suffix", () => {
    expect(formatDelta(12, 10)).toBe("+2");
    expect(formatDelta(8, 10)).toBe("-2");
    expect(formatDelta(12, 10, " min")).toBe("+2 min");
  });
});

describe("applyWorkoutLog", () => {
  const now = new Date("2026-10-13T12:00:00Z");
  const input: LogWorkoutInput = {
    workoutId: "strength-lab",
    title: "Strength Lab",
    duration: 45,
    calories: 360,
  };

  const session = (n: number): WorkoutSession => ({
    id: `recent-${n}`,
    workoutId: "lower-power",
    title: "Lower Power",
    duration: 40,
    calories: 390,
    completedAt: "2026-10-01T12:00:00.000Z",
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("puts the new session first with the logged fields", () => {
    const next = applyWorkoutLog(DEFAULT_PROGRESS, input);

    expect(next.recentSessions[0]).toEqual({
      id: `session-${now.getTime()}`,
      completedAt: now.toISOString(),
      ...input,
    });
    expect(next.updatedAt).toBe(now.toISOString());
  });

  it("keeps at most 6 recent sessions", () => {
    const progress: UserProgress = {
      ...DEFAULT_PROGRESS,
      recentSessions: [1, 2, 3, 4, 5, 6].map(session),
    };

    const next = applyWorkoutLog(progress, input);

    expect(next.recentSessions).toHaveLength(6);
    expect(next.recentSessions[0].id).toBe(`session-${now.getTime()}`);
    expect(next.recentSessions.map((s) => s.id)).not.toContain("recent-6");
  });

  it("updates the stats from the logged workout", () => {
    const { stats } = DEFAULT_PROGRESS;
    const next = applyWorkoutLog(DEFAULT_PROGRESS, input);

    expect(next.stats.completedSessions).toBe(stats.completedSessions + 1);
    expect(next.stats.workoutStreak).toBe(stats.workoutStreak + 1);
    expect(next.stats.caloriesBurned).toBe(stats.caloriesBurned + input.calories);
    expect(next.stats.weeklyMinutes).toBe(stats.weeklyMinutes + input.duration);
  });

  it("advances goals: consistency +8, others +3, capped at 100", () => {
    const progress: UserProgress = {
      ...DEFAULT_PROGRESS,
      goals: [
        { id: "goal-consistency", title: "Consistency", progress: 50, target: "" },
        { id: "goal-5k", title: "5K", progress: 50, target: "" },
        { id: "goal-strength", title: "Bench", progress: 99, target: "" },
      ],
    };

    const next = applyWorkoutLog(progress, input);

    expect(next.goals.map((g) => g.progress)).toEqual([58, 53, 100]);
  });

  it("does not mutate the input progress", () => {
    const before = structuredClone(DEFAULT_PROGRESS);

    applyWorkoutLog(DEFAULT_PROGRESS, input);

    expect(DEFAULT_PROGRESS).toEqual(before);
  });
});
