// The user's profile (Phase 6, P6-12, decision D41): a display name and an
// avatar without photos. Pure: the shape, its limits and its codec. The same
// limits are enforced by firestore.rules.
//
// The avatar is stored as { kind, ... } so a photo can be added later as a
// new kind without breaking profiles saved today.

export const AVATAR_COLORS = ["yellow", "green", "blue", "pink", "orange", "purple"] as const;
export type AvatarColor = (typeof AVATAR_COLORS)[number];

export type Avatar = { kind: "initials"; color: AvatarColor };

export type Profile = {
  displayName: string;
  avatar: Avatar;
  updatedAt: string;
};

export const DISPLAY_NAME_MAX = 40;

/** Swatch shown for each colour; text on it is near-black. */
export const AVATAR_SWATCH: Record<AvatarColor, string> = {
  yellow: "#ffd60a",
  green: "#30d158",
  blue: "#64d2ff",
  pink: "#ff6ea8",
  orange: "#ff9f0a",
  purple: "#bf8cff",
};

/** "PowrFit Athlete" → "PA"; "andy" → "A". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words.at(-1) ?? ""] : words;
  return letters.map((word) => word.charAt(0).toUpperCase()).join("") || "?";
}

/** A first profile from the email: "andy.l@x.com" → "andy.l", yellow. */
export function defaultProfile(email: string | null | undefined, now: string): Profile {
  const local = (email ?? "").split("@")[0]?.slice(0, DISPLAY_NAME_MAX) ?? "";
  return { displayName: local || "PowrFit Athlete", avatar: { kind: "initials", color: "yellow" }, updatedAt: now };
}

/** What has to be fixed before saving; empty when valid. */
export function profileProblems(profile: Pick<Profile, "displayName">): string[] {
  const name = profile.displayName.trim();
  if (name === "") return ["Enter a display name."];
  if (name.length > DISPLAY_NAME_MAX) return [`Keep the name to ${DISPLAY_NAME_MAX} characters.`];
  return [];
}

export function encodeProfile(profile: Profile): Record<string, unknown> {
  return {
    displayName: profile.displayName.trim(),
    avatar: { kind: profile.avatar.kind, color: profile.avatar.color },
    updatedAt: profile.updatedAt,
  };
}

/** The stored profile, or null when it's missing or unreadable. */
export function decodeProfile(data: unknown): Profile | null {
  if (typeof data !== "object" || data === null) return null;
  const { displayName, avatar, updatedAt } = data as Record<string, unknown>;
  if (typeof displayName !== "string" || typeof updatedAt !== "string") return null;
  if (typeof avatar !== "object" || avatar === null) return null;
  const { kind, color } = avatar as Record<string, unknown>;
  if (kind !== "initials" || !(AVATAR_COLORS as readonly unknown[]).includes(color)) return null;
  if (profileProblems({ displayName }).length > 0) return null;
  return { displayName, avatar: { kind, color: color as AvatarColor }, updatedAt };
}
