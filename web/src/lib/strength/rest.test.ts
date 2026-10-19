import { describe, expect, it } from "vitest";

import {
  DEFAULT_REST_SEC,
  addExercise,
  adjustRest,
  createDraft,
  finishDraft,
  skipRest,
  toggleSetDone,
  updateSet,
  type Routine,
} from "@/lib/strength";

// P4-04: the rest timer lives in the draft (D23).

const T0 = "2026-10-18T17:00:00.000Z";
const T1 = "2026-10-18T17:01:00.000Z";

function ticked(restSec?: number) {
  const routine: Routine = {
    id: "r1",
    name: "Bench",
    exercises: [{ exerciseId: "barbell-bench-press", targetSets: 2, ...(restSec !== undefined && { restSec }) }],
    createdAt: T0,
    updatedAt: T0,
  };
  const draft = createDraft({ id: "w1", now: T0, unit: "lb", routine });
  const filled = updateSet(draft, "e0", 0, { weight: 135, reps: 5 }, T1);
  return toggleSetDone(filled, "e0", 0, T1);
}

describe("rest timer", () => {
  it("starts the default rest when a set is ticked", () => {
    expect(DEFAULT_REST_SEC).toBe(90);
    expect(ticked().rest).toEqual({ endsAt: "2026-10-18T17:02:30.000Z", durationSec: 90 });
  });

  it("uses the routine's rest time, and none when it's 0", () => {
    expect(ticked(120).rest?.durationSec).toBe(120);
    expect(ticked(0).rest).toBeUndefined();
  });

  it("uses the default for exercises added during the workout", () => {
    let draft = addExercise(createDraft({ id: "w1", now: T0, unit: "lb" }), "hammer-curl", T0);
    draft = updateSet(draft, "e0", 0, { weight: 30, reps: 10 }, T1);
    expect(toggleSetDone(draft, "e0", 0, T1).rest?.durationSec).toBe(90);
  });

  it("doesn't restart when a set is unticked", () => {
    const draft = ticked();
    const later = "2026-10-18T17:02:00.000Z";
    expect(toggleSetDone(draft, "e0", 0, later).rest).toEqual(draft.rest);
  });

  it("adds and takes off time, never ending in the past", () => {
    const draft = ticked();
    expect(adjustRest(draft, 15, T1).rest).toEqual({ endsAt: "2026-10-18T17:02:45.000Z", durationSec: 105 });
    expect(adjustRest(draft, -15, T1).rest?.endsAt).toBe("2026-10-18T17:02:15.000Z");
    expect(adjustRest(draft, -600, T1).rest?.endsAt).toBe(T1);
  });

  it("can be skipped, and isn't saved with the workout", () => {
    const draft = ticked();
    expect(skipRest(draft, T1).rest).toBeUndefined();
    expect("rest" in finishDraft(draft, T1)).toBe(false);
  });
});
