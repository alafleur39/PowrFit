"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { defaultProfile, type Profile } from "@/lib/profile";
import { saveProfile, subscribeProfile } from "@/lib/workout/profile-repo";

/** Last profile seen this session, per user, so avatars don't flicker (D39). */
const lastSeen = new Map<string, Profile>();

/**
 * The signed-in user's profile (P6-12): the saved one, or a default made
 * from the email until they save their own.
 */
export function useProfile() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [saved, setSaved] = useState<{ uid: string; profile: Profile | null } | null>(() =>
    uid && lastSeen.has(uid) ? { uid, profile: lastSeen.get(uid) ?? null } : null
  );

  useEffect(() => {
    if (!uid) return;
    return subscribeProfile(uid, (profile) => {
      if (profile) lastSeen.set(uid, profile);
      setSaved({ uid, profile });
    });
  }, [uid]);

  const current = saved && saved.uid === uid ? saved.profile : null;
  const profile = current ?? defaultProfile(user?.email, "");
  const save = (next: Profile) => {
    if (!uid) return;
    lastSeen.set(uid, next);
    setSaved({ uid, profile: next });
    saveProfile(uid, next).catch((error: unknown) => console.error("Saving the profile failed", error));
  };
  return { profile, isDefault: current === null, save };
}
