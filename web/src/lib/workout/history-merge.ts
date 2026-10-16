// Combines Firestore results with device receipts into one list (P2-11), so
// History, Home and the summary agree on each workout's status:
//   - a failed receipt wins: the server refused that save;
//   - otherwise a document without pending writes is synced (confirmed);
//   - otherwise it's waiting to sync.
// Receipts whose document isn't in the results (for example when the
// persistent cache is unavailable) still appear, so nothing finished hides.

import type { WorkoutLog } from "@/lib/strength";
import type { Receipt } from "./receipts";
import type { LogEntry } from "./workout-repo";

export type DisplayStatus = "pending" | "synced" | "failed";

export type HistoryItem =
  | { id: string; status: DisplayStatus; log: WorkoutLog; errorCode?: string }
  | { id: string; status: DisplayStatus; problem: "unsupported" | "invalid" };

function endedAt(item: HistoryItem): string {
  return "log" in item ? item.log.endedAt : "";
}

export function mergeHistory(
  entries: readonly LogEntry[],
  receipts: readonly Receipt[]
): HistoryItem[] {
  const byId = new Map(receipts.map((receipt) => [receipt.log.id, receipt]));
  const seen = new Set<string>();

  const items: HistoryItem[] = entries.map((entry) => {
    seen.add(entry.id);
    const receipt = byId.get(entry.id);
    const status: DisplayStatus =
      receipt?.status === "failed" ? "failed" : entry.status === "synced" ? "synced" : "pending";

    if (entry.result.ok) {
      const errorCode = receipt?.status === "failed" ? receipt.errorCode : undefined;
      return { id: entry.id, status, log: entry.result.log, ...(errorCode && { errorCode }) };
    }
    // A failed receipt still has a readable copy of the workout.
    if (receipt) {
      return {
        id: entry.id,
        status,
        log: receipt.log,
        ...(receipt.status === "failed" && { errorCode: receipt.errorCode }),
      };
    }
    return { id: entry.id, status, problem: entry.result.reason };
  });

  for (const receipt of receipts) {
    if (seen.has(receipt.log.id)) continue;
    items.push(
      receipt.status === "failed"
        ? { id: receipt.log.id, status: "failed", log: receipt.log, errorCode: receipt.errorCode }
        : { id: receipt.log.id, status: "pending", log: receipt.log }
    );
  }

  // Failed saves first (they need attention), then newest first.
  return items.sort((a, b) => {
    if ((a.status === "failed") !== (b.status === "failed")) return a.status === "failed" ? -1 : 1;
    return endedAt(b).localeCompare(endedAt(a));
  });
}
