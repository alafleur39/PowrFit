"use client";

// The only module that reads or writes the user's routines (P4-01).
// Documents live at users/{uid}/routines/{routine.id}. Writes go through
// Firestore's persistent cache, so saving works offline and syncs later.

import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Routine } from "@/lib/strength";
import { decodeRoutine, encodeRoutine } from "./routine-codec";
import { syncStatusFromMetadata, type SyncStatus } from "./sync-status";

export type RoutineEntry = { routine: Routine; status: SyncStatus };

const routinesCollection = (uid: string) => collection(db, "users", uid, "routines");

export function saveRoutine(uid: string, routine: Routine): Promise<void> {
  return setDoc(doc(routinesCollection(uid), routine.id), encodeRoutine(routine));
}

export function deleteRoutine(uid: string, id: string): Promise<void> {
  return deleteDoc(doc(routinesCollection(uid), id));
}

/**
 * The user's routines, most recently edited first. Documents that can't be
 * read (a newer app version, bad data) are left out.
 */
export function subscribeRoutines(
  uid: string,
  onChange: (entries: RoutineEntry[]) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    query(routinesCollection(uid), orderBy("updatedAt", "desc")),
    { includeMetadataChanges: true },
    (snapshot) =>
      onChange(
        snapshot.docs.flatMap((item) => {
          const result = decodeRoutine(item.id, item.data());
          return result.ok
            ? [{ routine: result.routine, status: syncStatusFromMetadata(item.metadata) }]
            : [];
        })
      ),
    onError
  );
}
