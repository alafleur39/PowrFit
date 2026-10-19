import { describe, expect, it } from "vitest";

import type { Routine } from "@/lib/strength";
import { decodeRoutine, encodeRoutine } from "./routine-codec";

const routine: Routine = {
  id: "r1",
  name: "Back",
  notes: "Heavy rows first",
  exercises: [
    { exerciseId: "barbell-row", targetSets: 4, targetReps: "6", restSec: 120 },
    { exerciseId: "hammer-curl", targetSets: 3 },
  ],
  createdAt: "2026-10-18T10:00:00.000Z",
  updatedAt: "2026-10-18T10:00:00.000Z",
};

describe("encodeRoutine / decodeRoutine", () => {
  it("round-trips a routine and leaves out undefined fields", () => {
    const encoded = encodeRoutine(routine);
    expect(JSON.stringify(encoded)).not.toContain("undefined");
    expect((encoded.exercises as object[])[1]).toEqual({ exerciseId: "hammer-curl", targetSets: 3 });
    expect(decodeRoutine("r1", encoded)).toEqual({ ok: true, routine });
  });

  it("reports newer documents as unsupported", () => {
    expect(decodeRoutine("r1", { ...encodeRoutine(routine), schemaVersion: 2 })).toMatchObject({
      ok: false,
      reason: "unsupported",
    });
  });

  it.each([
    ["a mismatched id", { id: "other" }],
    ["a missing name", { name: undefined }],
    ["an exercise not in the catalog", { exercises: [{ exerciseId: "nope", targetSets: 3 }] }],
    ["zero sets", { exercises: [{ exerciseId: "barbell-row", targetSets: 0 }] }],
    ["fractional rest", { exercises: [{ exerciseId: "barbell-row", targetSets: 1, restSec: 1.5 }] }],
  ])("rejects %s", (_name, patch) => {
    expect(decodeRoutine("r1", { ...encodeRoutine(routine), ...patch })).toMatchObject({
      ok: false,
      reason: "invalid",
    });
  });
});
