// Device storage for the in-progress workout and unconfirmed saves (P2-07).
//
// Both live in localStorage under keys that include the user id, so one
// account never sees another's data on a shared device. Storage is passed in
// (window.localStorage in the app, a fake in tests).

import type { WorkoutDraft } from "@/lib/strength";
import type { Receipt } from "./receipts";

const VERSION = "v1";

export const draftKey = (uid: string) => `powrfit::draft::${VERSION}::${uid}`;
export const receiptsKey = (uid: string) => `powrfit::receipts::${VERSION}::${uid}`;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type LoadResult<T> = { value: T; corrupted: boolean };

function looksLikeDraft(value: unknown): value is WorkoutDraft {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Partial<WorkoutDraft>;
  return (
    typeof draft.id === "string" &&
    typeof draft.startedAt === "string" &&
    typeof draft.updatedAt === "string" &&
    (draft.unit === "kg" || draft.unit === "lb") &&
    typeof draft.nextKey === "number" &&
    Array.isArray(draft.exercises)
  );
}

function looksLikeReceipts(value: unknown): value is Receipt[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        (item.status === "pending" || item.status === "failed") &&
        typeof item.log?.id === "string"
    )
  );
}

/**
 * Reads and checks a stored value. Anything unreadable is moved aside to a
 * "::corrupt" key (so it isn't lost) and reported, never silently dropped.
 */
function load<T>(
  storage: StorageLike,
  key: string,
  check: (value: unknown) => value is T,
  empty: T
): LoadResult<T> {
  const raw = storage.getItem(key);
  if (raw === null) return { value: empty, corrupted: false };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (check(parsed)) return { value: parsed, corrupted: false };
  } catch {
    // fall through
  }
  try {
    storage.setItem(`${key}::corrupt`, raw);
  } catch {
    // Storage full; the original stays where it is.
    return { value: empty, corrupted: true };
  }
  storage.removeItem(key);
  return { value: empty, corrupted: true };
}

/** Returns false if storage refused the write (full or blocked). */
function save(storage: StorageLike, key: string, value: unknown | null): boolean {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadDraft(storage: StorageLike, uid: string): LoadResult<WorkoutDraft | null> {
  return load<WorkoutDraft | null>(
    storage,
    draftKey(uid),
    (value): value is WorkoutDraft | null => looksLikeDraft(value),
    null
  );
}

export function saveDraft(storage: StorageLike, uid: string, draft: WorkoutDraft | null): boolean {
  return save(storage, draftKey(uid), draft);
}

export function loadReceipts(storage: StorageLike, uid: string): LoadResult<Receipt[]> {
  return load(storage, receiptsKey(uid), looksLikeReceipts, []);
}

export function saveReceipts(storage: StorageLike, uid: string, receipts: Receipt[]): boolean {
  return save(storage, receiptsKey(uid), receipts.length > 0 ? receipts : null);
}
