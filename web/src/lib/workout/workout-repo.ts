"use client";

// The only module that reads or writes workouts in Firestore (P2-05).
// Documents live at users/{uid}/workoutLogs/{log.id}. Writing with the log's
// own id makes saves idempotent: retrying can never create a second copy.

import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  type DocumentSnapshot,
  type Query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { WorkoutLog } from "@/lib/strength";
import { decodeWorkoutLog, encodeWorkoutLog, type DecodeResult } from "./workout-codec";
import { syncStatusFromMetadata, type SyncStatus } from "./sync-status";

export type LogEntry = {
  id: string;
  status: SyncStatus;
  result: DecodeResult;
};

const logsCollection = (uid: string) => collection(db, "users", uid, "workoutLogs");

/**
 * Resolves once the server has confirmed the write. While offline it stays
 * pending (the write is queued in the persistent cache); it rejects only if
 * the server refuses the write.
 */
export function saveWorkoutLog(uid: string, log: WorkoutLog): Promise<void> {
  return setDoc(doc(logsCollection(uid), log.id), encodeWorkoutLog(log));
}

function toEntry(snapshot: DocumentSnapshot): LogEntry {
  return {
    id: snapshot.id,
    status: syncStatusFromMetadata(snapshot.metadata),
    result: decodeWorkoutLog(snapshot.id, snapshot.data()),
  };
}

function subscribe(
  q: Query,
  onChange: (entries: LogEntry[]) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => onChange(snapshot.docs.map(toEntry)),
    onError
  );
}

/** The newest `count` workouts, newest first. */
export function subscribeRecent(
  uid: string,
  count: number,
  onChange: (entries: LogEntry[]) => void,
  onError: (error: Error) => void
): () => void {
  return subscribe(
    query(logsCollection(uid), orderBy("endedAt", "desc"), limit(count)),
    onChange,
    onError
  );
}

/** Workouts that ended at or after `isoDate` (UTC ISO strings sort by time). */
export function subscribeSince(
  uid: string,
  isoDate: string,
  onChange: (entries: LogEntry[]) => void,
  onError: (error: Error) => void
): () => void {
  return subscribe(
    query(logsCollection(uid), where("endedAt", ">=", isoDate), orderBy("endedAt", "desc")),
    onChange,
    onError
  );
}

/** One workout; `null` when it doesn't exist (or isn't in the cache offline). */
export function subscribeWorkoutLog(
  uid: string,
  id: string,
  onChange: (entry: LogEntry | null) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    doc(logsCollection(uid), id),
    { includeMetadataChanges: true },
    (snapshot) => onChange(snapshot.exists() ? toEntry(snapshot) : null),
    onError
  );
}
