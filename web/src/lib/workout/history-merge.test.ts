import { describe, expect, it } from "vitest";

import type { WorkoutLog } from "@/lib/strength";
import { mergeHistory } from "./history-merge";
import type { Receipt } from "./receipts";
import type { LogEntry } from "./workout-repo";

function log(id: string, endedAt: string): WorkoutLog {
  return {
    id,
    schemaVersion: 1,
    startedAt: endedAt,
    endedAt,
    updatedAt: endedAt,
    exercises: [
      { exerciseId: "pull-up", exerciseName: "Pull-up", sets: [{ reps: 8, weight: 0, unit: "lb", done: true }] },
    ],
    exerciseIds: ["pull-up"],
    totals: { sets: 1, reps: 8, volume: 0, unit: "lb" },
  };
}

const entry = (l: WorkoutLog, status: "pending" | "synced"): LogEntry => ({
  id: l.id,
  status,
  result: { ok: true, log: l },
});

const a = log("a", "2026-10-14T10:00:00.000Z");
const b = log("b", "2026-10-15T10:00:00.000Z");
const c = log("c", "2026-10-16T10:00:00.000Z");

describe("mergeHistory", () => {
  it("passes server statuses through, newest first", () => {
    const items = mergeHistory([entry(a, "synced"), entry(c, "pending"), entry(b, "synced")], []);
    expect(items.map((item) => [item.id, item.status])).toEqual([
      ["c", "pending"],
      ["b", "synced"],
      ["a", "synced"],
    ]);
  });

  it("never shows a failed save as synced, and lists it first", () => {
    const receipts: Receipt[] = [{ status: "failed", log: a, errorCode: "permission-denied" }];
    const items = mergeHistory([entry(a, "synced"), entry(c, "synced")], receipts);
    expect(items[0]).toMatchObject({ id: "a", status: "failed", errorCode: "permission-denied" });
  });

  it("shows receipts missing from the results", () => {
    const receipts: Receipt[] = [
      { status: "pending", log: c },
      { status: "failed", log: b, errorCode: "invalid-argument" },
    ];
    const items = mergeHistory([entry(a, "synced")], receipts);
    expect(items.map((item) => [item.id, item.status])).toEqual([
      ["b", "failed"],
      ["c", "pending"],
      ["a", "synced"],
    ]);
  });

  it("treats a pending receipt with a confirmed document as synced", () => {
    const items = mergeHistory([entry(a, "synced")], [{ status: "pending", log: a }]);
    expect(items).toEqual([{ id: "a", status: "synced", log: a }]);
  });

  it("marks unreadable documents instead of hiding them", () => {
    const unsupported: LogEntry = {
      id: "x",
      status: "synced",
      result: { ok: false, reason: "unsupported", detail: "schemaVersion 2" },
    };
    expect(mergeHistory([unsupported], [])).toEqual([
      { id: "x", status: "synced", problem: "unsupported" },
    ]);
  });
});
