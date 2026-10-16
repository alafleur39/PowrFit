// Sync status rules (Phase 2 plan, section B). Pure, so they can be tested
// without Firestore.

/** What the server has confirmed about a saved workout. */
export type SyncStatus = "pending" | "synced";

/**
 * A document with local writes the server hasn't acknowledged is pending.
 * Anything else in the cache has been confirmed by the server at some point:
 * the SDK drops writes the server rejects instead of keeping them.
 */
export function syncStatusFromMetadata(metadata: { hasPendingWrites: boolean }): SyncStatus {
  return metadata.hasPendingWrites ? "pending" : "synced";
}

/** Errors that heal by waiting or retrying (mostly network and server load). */
const RETRYABLE = new Set([
  "unavailable",
  "deadline-exceeded",
  "resource-exhausted",
  "aborted",
  "internal",
  "cancelled",
  "unknown",
]);

/**
 * "retryable" errors resolve themselves; "fatal" ones (permission-denied,
 * invalid-argument, failed-precondition, unauthenticated, ...) never will,
 * so the user has to decide what to do.
 */
export function classifyError(code: string | undefined): "retryable" | "fatal" {
  return code !== undefined && RETRYABLE.has(code) ? "retryable" : "fatal";
}

/** Firestore error codes arrive as "permission-denied" or "firestore/permission-denied". */
export function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) return undefined;
  const code = (error as { code: unknown }).code;
  return typeof code === "string" ? code.replace(/^firestore\//, "") : undefined;
}
