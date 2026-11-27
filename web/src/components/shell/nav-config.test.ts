import { describe, expect, it } from "vitest";

import { isDestinationActive, isSamePath } from "./nav-config";

// The iOS app's static export ends paths with "/" ("/log/"); the website
// doesn't. Both must count as the same page (the in-progress bar covered the
// rest timer in the app because "/log/" !== "/log").
describe("paths", () => {
  it("treats a trailing slash as the same page", () => {
    expect(isSamePath("/log", "/log")).toBe(true);
    expect(isSamePath("/log/", "/log")).toBe(true);
    expect(isSamePath("/log//", "/log")).toBe(true);
    expect(isSamePath("/", "/")).toBe(true);
    expect(isSamePath("/login/", "/log")).toBe(false);
    expect(isSamePath("/log/extra", "/log")).toBe(false);
  });

  it("lights a tab on its page, with or without the slash, and below it", () => {
    expect(isDestinationActive("/workouts", "/workouts")).toBe(true);
    expect(isDestinationActive("/workouts", "/workouts/")).toBe(true);
    expect(isDestinationActive("/workouts", "/workouts/history/view/")).toBe(true);
    expect(isDestinationActive("/workouts", "/workoutsx")).toBe(false);
  });
});
