// Receipts: device copies of finished workouts the server hasn't confirmed
// yet (Phase 2 plan, section B). Firestore drops a write the server rejects,
// so without a receipt a failed save would vanish. A receipt is removed only
// when the save is confirmed or the user discards it.
//
//   finish ──► pending ──confirmed──► (removed)
//                 │  ▲
//          fatal  │  │ retry
//                 ▼  │
//               failed ──discard──► (removed)

import type { WorkoutLog } from "@/lib/strength";

export type Receipt =
  | { status: "pending"; log: WorkoutLog }
  | { status: "failed"; log: WorkoutLog; errorCode: string };

function replace(receipts: Receipt[], id: string, next: Receipt | null): Receipt[] {
  return receipts.flatMap((receipt) => {
    if (receipt.log.id !== id) return [receipt];
    return next ? [next] : [];
  });
}

/** Adds a pending receipt; finishing the same workout twice keeps one. */
export function addPending(receipts: Receipt[], log: WorkoutLog): Receipt[] {
  const others = receipts.filter((receipt) => receipt.log.id !== log.id);
  return [...others, { status: "pending", log }];
}

export function markConfirmed(receipts: Receipt[], id: string): Receipt[] {
  return replace(receipts, id, null);
}

export function markFailed(receipts: Receipt[], id: string, errorCode: string): Receipt[] {
  const receipt = receipts.find((item) => item.log.id === id);
  if (!receipt) return receipts;
  return replace(receipts, id, { status: "failed", log: receipt.log, errorCode });
}

export function markRetrying(receipts: Receipt[], id: string): Receipt[] {
  const receipt = receipts.find((item) => item.log.id === id);
  if (!receipt || receipt.status !== "failed") return receipts;
  return replace(receipts, id, { status: "pending", log: receipt.log });
}

export function discardReceipt(receipts: Receipt[], id: string): Receipt[] {
  return replace(receipts, id, null);
}

export function hasUnsyncedWork(draftExists: boolean, receipts: Receipt[]): boolean {
  return draftExists || receipts.length > 0;
}
