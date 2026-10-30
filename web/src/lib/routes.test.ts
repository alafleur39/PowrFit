import { afterEach, describe, expect, it, vi } from "vitest";

import { NEW_ROUTINE_HREF, apiUrl, routineHref, workoutLogHref } from "./routes";

describe("links to saved items", () => {
  it("puts the id in the query string", () => {
    expect(workoutLogHref("3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90")).toBe(
      "/workouts/history/view?id=3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90"
    );
    expect(routineHref("abc")).toBe("/workouts/routines/edit?id=abc");
    expect(NEW_ROUTINE_HREF).toBe("/workouts/routines/edit?id=new");
  });

  it("escapes ids", () => {
    expect(workoutLogHref("a&b=c")).toBe("/workouts/history/view?id=a%26b%3Dc");
  });
});

describe("apiUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stays on the same site by default", () => {
    vi.stubEnv("NEXT_PUBLIC_API_ORIGIN", "");
    expect(apiUrl("/api/gyms?cell=dr5ru7")).toBe("/api/gyms?cell=dr5ru7");
  });

  it("uses the configured origin in the iOS build", () => {
    vi.stubEnv("NEXT_PUBLIC_API_ORIGIN", "https://powrfit-andylafleur.netlify.app");
    expect(apiUrl("/api/gyms")).toBe("https://powrfit-andylafleur.netlify.app/api/gyms");
  });
});
