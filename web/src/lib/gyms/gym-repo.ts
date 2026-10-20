"use client";

// Reads curated gym prices and sends price reports (P6-04). Prices are
// read straight from Firestore by the phone; the /api/gyms endpoint only
// finds gyms on the map, so it never touches the database.

import { addDoc, collection, doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { decodeGymPrices, encodePriceReport, isPlaceId, type GymPrices, type PriceReport } from "./gyms";

/** Curated prices for these gyms, keyed by place id; gyms without any are left out. */
export async function loadGymPrices(placeIds: readonly string[]): Promise<Map<string, GymPrices>> {
  const results = await Promise.all(
    placeIds.filter(isPlaceId).map(async (placeId) => {
      try {
        const snapshot = await getDoc(doc(db, "gyms", placeId));
        const prices = snapshot.exists() ? decodeGymPrices(snapshot.data()) : null;
        return prices ? ([placeId, prices] as const) : null;
      } catch {
        return null;
      }
    })
  );
  return new Map(results.filter((entry): entry is readonly [string, GymPrices] => entry !== null));
}

/** Queues a report; offline it's sent when the connection returns. */
export function sendPriceReport(report: PriceReport): Promise<unknown> {
  return addDoc(collection(db, "gymPriceReports"), encodePriceReport(report));
}
