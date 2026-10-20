"use client";

// Deleting an account (Phase 5, P5-05, decision D31): every document the
// user owns, then the login itself. Needs a connection: the list of
// documents comes from the server, not the cache, so nothing is missed.

import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  type User,
} from "firebase/auth";
import { collection, doc, getDocsFromServer, writeBatch, type DocumentReference } from "firebase/firestore";

import { db } from "@/lib/firebase";

/**
 * Collections under users/{uid} that can be listed, including the retired
 * Phase 0 ones. settings holds one document, deleted by its path below.
 */
export const USER_COLLECTIONS = [
  "workoutLogs",
  "routines",
  "dashboard",
  "goals",
  "upcomingSessions",
  "workoutSessions",
] as const;

/** Firestore's limit on writes in one batch. */
const BATCH_LIMIT = 500;

/** Deletes everything stored under users/{uid}. */
export async function deleteUserData(uid: string): Promise<void> {
  const refs: DocumentReference[] = [];
  for (const name of USER_COLLECTIONS) {
    const snapshot = await getDocsFromServer(collection(db, "users", uid, name));
    refs.push(...snapshot.docs.map((item) => item.ref));
  }
  // The rules allow the settings documents by path only (no listing).
  refs.push(doc(db, "users", uid, "settings", "preferences"));
  refs.push(doc(db, "users", uid, "settings", "profile"));

  for (let start = 0; start < refs.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const ref of refs.slice(start, start + BATCH_LIMIT)) batch.delete(ref);
    await batch.commit();
  }
}

/**
 * Confirms the password (Firebase only deletes a login after a recent
 * sign-in), deletes the user's data, then the login.
 */
export async function deleteAccount(
  user: User,
  password: string,
  /** Runs after the data is gone, while the user is still signed in. */
  onDataDeleted: () => void
): Promise<void> {
  if (!user.email) throw new Error("This account has no email address");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  await deleteUserData(user.uid);
  onDataDeleted();
  await deleteUser(user);
}
