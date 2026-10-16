import { describe, expect, it } from "vitest";

import { createDraft, finishDraft, addExercise, updateSet, toggleSetDone } from "@/lib/strength";
import {
  draftKey,
  loadDraft,
  loadReceipts,
  receiptsKey,
  saveDraft,
  saveReceipts,
} from "./draft-storage";
import {
  addPending,
  discardReceipt,
  hasUnsyncedWork,
  markConfirmed,
  markFailed,
  markRetrying,
  type Receipt,
} from "./receipts";

class FakeStorage {
  items = new Map<string, string>();
  full = false;
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.full) throw new DOMException("full", "QuotaExceededError");
    this.items.set(key, value);
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
}

const T0 = "2026-10-16T17:00:00.000Z";
const T1 = "2026-10-16T18:00:00.000Z";
const draft = createDraft({ id: "w1", now: T0, unit: "lb" });

function finishedLog(id: string) {
  let d = createDraft({ id, now: T0, unit: "lb" });
  d = addExercise(d, "pull-up", T0);
  d = updateSet(d, "e0", 0, { weight: 0, reps: 8 }, T0);
  d = toggleSetDone(d, "e0", 0, T0);
  return finishDraft(d, T1);
}

describe("draft storage", () => {
  it("round-trips a draft", () => {
    const storage = new FakeStorage();
    expect(saveDraft(storage, "alice", draft)).toBe(true);
    expect(loadDraft(storage, "alice")).toEqual({ value: draft, corrupted: false });
  });

  it("keeps each user's draft separate", () => {
    const storage = new FakeStorage();
    saveDraft(storage, "alice", draft);
    expect(loadDraft(storage, "bob")).toEqual({ value: null, corrupted: false });
  });

  it("clears the draft when saving null", () => {
    const storage = new FakeStorage();
    saveDraft(storage, "alice", draft);
    saveDraft(storage, "alice", null);
    expect(storage.items.has(draftKey("alice"))).toBe(false);
  });

  it.each([
    ["broken JSON", "{not json"],
    ["wrong shape", JSON.stringify({ hello: "world" })],
  ])("moves a %s draft aside instead of losing it", (_name, raw) => {
    const storage = new FakeStorage();
    storage.setItem(draftKey("alice"), raw);
    expect(loadDraft(storage, "alice")).toEqual({ value: null, corrupted: true });
    expect(storage.getItem(`${draftKey("alice")}::corrupt`)).toBe(raw);
    expect(storage.getItem(draftKey("alice"))).toBeNull();
  });

  it("reports a refused write instead of throwing", () => {
    const storage = new FakeStorage();
    storage.full = true;
    expect(saveDraft(storage, "alice", draft)).toBe(false);
  });

  it("uses versioned keys", () => {
    expect(draftKey("alice")).toBe("powrfit::draft::v1::alice");
    expect(receiptsKey("alice")).toBe("powrfit::receipts::v1::alice");
  });
});

describe("receipt storage", () => {
  it("round-trips receipts and removes the key when empty", () => {
    const storage = new FakeStorage();
    const receipts = addPending([], finishedLog("w1"));
    saveReceipts(storage, "alice", receipts);
    expect(loadReceipts(storage, "alice").value).toEqual(receipts);
    saveReceipts(storage, "alice", []);
    expect(storage.items.has(receiptsKey("alice"))).toBe(false);
  });
});

describe("receipt transitions", () => {
  const log = finishedLog("w1");

  it("goes pending → confirmed (removed)", () => {
    const pending = addPending([], log);
    expect(pending).toEqual([{ status: "pending", log }]);
    expect(markConfirmed(pending, "w1")).toEqual([]);
  });

  it("goes pending → failed → retry → pending", () => {
    const failed = markFailed(addPending([], log), "w1", "permission-denied");
    expect(failed).toEqual([{ status: "failed", log, errorCode: "permission-denied" }]);
    expect(markRetrying(failed, "w1")).toEqual([{ status: "pending", log }]);
  });

  it("keeps one receipt when the same workout is finished twice", () => {
    expect(addPending(addPending([], log), log)).toHaveLength(1);
  });

  it("ignores unknown ids and retrying a pending receipt", () => {
    const pending: Receipt[] = addPending([], log);
    expect(markFailed(pending, "nope", "x")).toBe(pending);
    expect(markRetrying(pending, "w1")).toBe(pending);
  });

  it("discards a receipt", () => {
    expect(discardReceipt(addPending([], log), "w1")).toEqual([]);
  });

  it("reports unsynced work for the sign-out warning", () => {
    expect(hasUnsyncedWork(false, [])).toBe(false);
    expect(hasUnsyncedWork(true, [])).toBe(true);
    expect(hasUnsyncedWork(false, addPending([], log))).toBe(true);
  });
});
