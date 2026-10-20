"use client";

// Reads and writes users/{uid}/settings/profile (P6-12). Through Firestore's
// persistent cache, so editing works offline and syncs later.

import { doc, onSnapshot, setDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { decodeProfile, encodeProfile, type Profile } from "@/lib/profile";

export const profileDoc = (uid: string) => doc(db, "users", uid, "settings", "profile");

export function saveProfile(uid: string, profile: Profile): Promise<void> {
  return setDoc(profileDoc(uid), encodeProfile(profile));
}

/** The saved profile, or null when there isn't one yet. */
export function subscribeProfile(
  uid: string,
  onChange: (profile: Profile | null) => void
): () => void {
  return onSnapshot(
    profileDoc(uid),
    (snapshot) => onChange(snapshot.exists() ? decodeProfile(snapshot.data()) : null),
    () => onChange(null)
  );
}
