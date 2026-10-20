import { describe, expect, it } from "vitest";

import { suggestTopics, type LoggedExercise, type WorkoutLog } from "@/lib/strength";

const NOW = new Date("2026-10-19T18:00:00.000Z");
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

const ex = (exerciseId: string, exerciseName: string, weight: number, sets = 1): LoggedExercise => ({
  exerciseId,
  exerciseName,
  sets: Array.from({ length: sets }, () => ({ weight, reps: 5, unit: "lb" as const, done: true })),
});
const bench = (weight: number, sets = 1) => ex("barbell-bench-press", "Barbell bench press", weight, sets);
const row = (weight: number, sets = 1) => ex("barbell-row", "Barbell row", weight, sets);

let next = 0;
function log(days: number, exercises: LoggedExercise[]): WorkoutLog {
  next += 1;
  const at = daysAgo(days);
  return {
    id: `w${next}`,
    schemaVersion: 1,
    startedAt: at,
    endedAt: at,
    updatedAt: at,
    exercises,
    exerciseIds: exercises.map((e) => e.exerciseId),
    totals: { sets: 0, reps: 0, volume: 0, unit: "lb" },
  };
}

const topics = (logs: WorkoutLog[], limit = 10) => suggestTopics(logs, NOW, limit).map((s) => s.topic);

describe("suggestTopics", () => {
  it("suggests nothing without history", () => {
    expect(suggestTopics([], NOW)).toEqual([]);
  });

  it("welcomes a beginner", () => {
    const [first] = suggestTopics([log(1, [bench(95)])], NOW);
    expect(first).toMatchObject({ kind: "beginner", reason: "You're just getting started" });
  });

  it("suggests a comeback after 10 days off, first", () => {
    const logs = [log(12, [bench(135)]), log(20, [bench(135)])];
    const [first] = suggestTopics(logs, NOW);
    expect(first).toMatchObject({ kind: "comeback", reason: "Your last workout was 12 days ago" });
    expect(topics([log(9, [bench(135)]), log(20, [bench(135)])])).not.toContain("comeback");
  });

  it("finds a plateau: two recent workouts that don't beat an older best", () => {
    const logs = [log(2, [bench(185)]), log(9, [bench(180)]), log(40, [bench(185)]), log(60, [bench(175)])];
    const plateau = suggestTopics(logs, NOW, 10).find((s) => s.kind === "plateau");
    expect(plateau).toMatchObject({
      topic: "plateau:barbell-bench-press",
      title: "Break your barbell bench press plateau",
      query: "how to break a barbell bench press plateau",
    });
    expect(plateau?.reason).toMatch(/^Your best barbell bench press hasn't gone up since /);
  });

  it("doesn't call it a plateau when the lift went up, or with one recent workout", () => {
    expect(topics([log(2, [bench(190)]), log(9, [bench(180)]), log(40, [bench(185)])])).not.toContain(
      "plateau:barbell-bench-press"
    );
    expect(topics([log(2, [bench(180)]), log(40, [bench(185)])])).not.toContain("plateau:barbell-bench-press");
  });

  it("suggests form videos for exercises new in the latest workout", () => {
    const logs = [log(1, [bench(135), row(95)]), log(5, [bench(135)])];
    expect(topics(logs)).toContain("form:barbell-row");
    expect(topics(logs)).not.toContain("form:barbell-bench-press");
  });

  it("flags much more pushing than pulling over 4 weeks", () => {
    const logs = [log(1, [bench(135, 6), row(95, 2)]), log(4, [bench(135, 6)])];
    const balance = suggestTopics(logs, NOW, 10).find((s) => s.kind === "balance");
    expect(balance?.reason).toBe("6x more pushing than pulling in the last 4 weeks");
    expect(topics([log(1, [bench(135, 6), row(95, 6)]), log(4, [bench(135, 6), row(95, 6)])])).not.toContain(
      "balance:push-pull"
    );
  });

  it("returns at most `limit`, most useful first", () => {
    const logs = [log(11, [bench(135, 6), row(95)]), log(13, [bench(135, 6)])];
    expect(suggestTopics(logs, NOW).map((s) => s.kind)).toEqual(["comeback", "new-exercise"]);
  });
});
