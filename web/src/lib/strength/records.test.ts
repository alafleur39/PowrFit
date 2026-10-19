import { describe, expect, it } from "vitest";

import { beatsBest, bestWeightsKg, recordsByLog, type LoggedSet, type WorkoutLog } from "@/lib/strength";

let n = 0;
function workout(day: number, exercises: Record<string, LoggedSet[]>): WorkoutLog {
  n += 1;
  const at = `2026-10-${String(day).padStart(2, "0")}T18:00:00.000Z`;
  return {
    id: `w${n}`,
    schemaVersion: 1,
    startedAt: at,
    endedAt: at,
    updatedAt: at,
    exercises: Object.entries(exercises).map(([exerciseId, sets]) => ({
      exerciseId,
      exerciseName: exerciseId,
      sets,
    })),
    exerciseIds: Object.keys(exercises),
    totals: { sets: 0, reps: 0, volume: 0, unit: "lb" },
  };
}
const lb = (weight: number, reps = 5, done = true): LoggedSet => ({ weight, reps, unit: "lb", done });
const kg = (weight: number, reps = 5): LoggedSet => ({ weight, reps, unit: "kg", done: true });

describe("personal records", () => {
  it("doesn't count the first time an exercise is done", () => {
    expect(recordsByLog([workout(1, { bench: [lb(135)] })]).size).toBe(0);
  });

  it("finds the heaviest set that beats every earlier workout", () => {
    const first = workout(1, { bench: [lb(135)], row: [lb(95)] });
    const second = workout(2, { bench: [lb(140, 3), lb(145, 2)], row: [lb(95)] });
    // Passed newest first, as history arrives; the order doesn't matter.
    const records = recordsByLog([second, first]);
    expect(records.get(second.id)).toEqual([
      { exerciseId: "bench", exerciseName: "bench", weight: 145, unit: "lb", reps: 2 },
    ]);
    expect(records.has(first.id)).toBe(false);
  });

  it("ignores unfinished sets, ties and lighter sets", () => {
    const first = workout(1, { bench: [lb(135)] });
    const tie = workout(2, { bench: [lb(135), lb(200, 1, false)] });
    const lighter = workout(3, { bench: [lb(130)] });
    expect(recordsByLog([first, tie, lighter]).size).toBe(0);
  });

  it("compares across units", () => {
    const first = workout(1, { squat: [kg(100)] }); // 220.46 lb
    const notPr = workout(2, { squat: [lb(220)] });
    const pr = workout(3, { squat: [lb(225)] });
    const records = recordsByLog([first, notPr, pr]);
    expect([...records.keys()]).toEqual([pr.id]);
  });

  it("gives the best per exercise for live comparison", () => {
    const best = bestWeightsKg([workout(1, { bench: [lb(100), kg(50)] })]);
    expect(best.get("bench")).toBeCloseTo(50);
    expect(beatsBest(lb(111), best.get("bench"))).toBe(true);
    expect(beatsBest(lb(110), best.get("bench"))).toBe(false);
    expect(beatsBest(lb(500), undefined)).toBe(false);
  });
});
