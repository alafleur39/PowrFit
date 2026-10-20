import { describe, expect, it } from "vitest";

import { decodeProfile, defaultProfile, encodeProfile, initials, profileProblems } from "./profile";

const T = "2026-10-19T18:00:00.000Z";

describe("profile", () => {
  it("makes initials from one or more words", () => {
    expect(initials("PowrFit Athlete")).toBe("PA");
    expect(initials("andy")).toBe("A");
    expect(initials("  Mary Ann  Lee ")).toBe("ML");
    expect(initials("   ")).toBe("?");
  });

  it("starts from the email's name part", () => {
    expect(defaultProfile("andy.l@example.com", T)).toEqual({
      displayName: "andy.l",
      avatar: { kind: "initials", color: "yellow" },
      updatedAt: T,
    });
    expect(defaultProfile(null, T).displayName).toBe("PowrFit Athlete");
  });

  it("checks the name", () => {
    expect(profileProblems({ displayName: " " })).toEqual(["Enter a display name."]);
    expect(profileProblems({ displayName: "x".repeat(41) })).toEqual(["Keep the name to 40 characters."]);
    expect(profileProblems({ displayName: "Andy" })).toEqual([]);
  });

  it("round-trips and rejects anything else", () => {
    const profile = { displayName: "Andy ", avatar: { kind: "initials" as const, color: "blue" as const }, updatedAt: T };
    expect(decodeProfile(encodeProfile(profile))).toEqual({ ...profile, displayName: "Andy" });
    expect(decodeProfile({ ...encodeProfile(profile), avatar: { kind: "photo", url: "x" } })).toBeNull();
    expect(decodeProfile({ ...encodeProfile(profile), avatar: { kind: "initials", color: "teal" } })).toBeNull();
    expect(decodeProfile({ ...encodeProfile(profile), displayName: "" })).toBeNull();
    expect(decodeProfile(undefined)).toBeNull();
  });
});
