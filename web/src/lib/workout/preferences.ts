"use client";

// The user's weight unit (P2-13), stored at users/{uid}/settings/preferences
// so it follows them across devices. Reads and writes go through Firestore's
// persistent cache, so the switch works offline too. Default: lb (D8).

import { doc, onSnapshot, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { WeightUnit } from "@/lib/strength";

export const DEFAULT_WEIGHT_UNIT: WeightUnit = "lb";

const preferencesDoc = (uid: string) => doc(db, "users", uid, "settings", "preferences");

export function parseWeightUnit(value: unknown): WeightUnit {
  return value === "kg" || value === "lb" ? value : DEFAULT_WEIGHT_UNIT;
}

export function subscribeWeightUnit(
  uid: string,
  onChange: (unit: WeightUnit) => void
): () => void {
  return onSnapshot(
    preferencesDoc(uid),
    (snapshot) => onChange(parseWeightUnit(snapshot.data()?.weightUnit)),
    () => onChange(DEFAULT_WEIGHT_UNIT)
  );
}

export function saveWeightUnit(uid: string, unit: WeightUnit): Promise<void> {
  return setDoc(preferencesDoc(uid), { weightUnit: unit }, { merge: true });
}
