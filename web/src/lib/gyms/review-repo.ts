"use client";

// Price review for the admin (Phase 8). The rules let only users with an
// admins/{uid} document (made in the Firebase console) read reports, write
// gym prices and ban senders; everyone else gets permission errors.

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { approvedPrices, decodeGymPrices, decodePriceReport, type StoredPriceReport } from "./gyms";

/** Whether this user may review prices. Any failure means no. */
export async function isAdmin(uid: string): Promise<boolean> {
  try {
    return (await getDoc(doc(db, "admins", uid))).exists();
  } catch {
    return false;
  }
}

/** Reports waiting for review, oldest first. */
export async function loadPriceReports(): Promise<StoredPriceReport[]> {
  const snapshot = await getDocs(query(collection(db, "gymPriceReports"), orderBy("createdAt"), limit(100)));
  return snapshot.docs
    .map((report) => decodePriceReport(report.id, report.data()))
    .filter((report): report is StoredPriceReport => report !== null);
}

/** Today's date, "2026-11-18", in the admin's time zone. */
const today = () => new Date().toLocaleDateString("en-CA");

/** Adds the reported plan to the gym's prices and clears the report, together. */
export function approveReport(report: StoredPriceReport): Promise<void> {
  return runTransaction(db, async (transaction) => {
    const gymRef = doc(db, "gyms", report.placeId);
    const current = await transaction.get(gymRef);
    const existing = current.exists() ? decodeGymPrices(current.data()) : null;
    transaction.set(gymRef, approvedPrices(existing, report, today()));
    transaction.delete(doc(db, "gymPriceReports", report.id));
  });
}

export function rejectReport(report: StoredPriceReport): Promise<void> {
  return deleteDoc(doc(db, "gymPriceReports", report.id));
}

/** Stops the sender reporting again and clears this report. */
export function banSender(report: StoredPriceReport): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, "bannedUsers", report.uid), { bannedAt: serverTimestamp(), reason: "price report spam" });
  batch.delete(doc(db, "gymPriceReports", report.id));
  return batch.commit();
}
