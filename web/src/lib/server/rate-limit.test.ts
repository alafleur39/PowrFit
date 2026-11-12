import { describe, expect, it } from "vitest";

import { createRateLimiter, tooManyRequests, waitText } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows max requests per window, then says when to retry", () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 60_000 });
    expect(limiter.take("alice", 0)).toEqual({ allowed: true });
    expect(limiter.take("alice", 1_000)).toEqual({ allowed: true });
    expect(limiter.take("alice", 2_000)).toEqual({ allowed: true });
    expect(limiter.take("alice", 15_000)).toEqual({ allowed: false, retryAfterSec: 45 });
  });

  it("counts each user separately", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    expect(limiter.take("alice", 0).allowed).toBe(true);
    expect(limiter.take("bob", 0).allowed).toBe(true);
    expect(limiter.take("alice", 1).allowed).toBe(false);
  });

  it("starts a fresh window once the last one ends", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    expect(limiter.take("alice", 0).allowed).toBe(true);
    expect(limiter.take("alice", 59_999).allowed).toBe(false);
    expect(limiter.take("alice", 60_000).allowed).toBe(true);
  });

  it("keeps working with many users", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1_000 });
    for (let i = 0; i < 6_000; i++) limiter.take(`user-${i}`, 0);
    expect(limiter.take("user-1", 500).allowed).toBe(false);
    expect(limiter.take("user-1", 2_000).allowed).toBe(true);
  });
});

describe("tooManyRequests", () => {
  it("answers 429, uncached, with when to retry", async () => {
    const response = tooManyRequests(90, "Slow down.");
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("90");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("capacitor://localhost");
    expect(await response.json()).toEqual({ error: "Slow down." });
  });

  it("says the wait in minutes", () => {
    expect(waitText(5)).toBe("a minute");
    expect(waitText(61)).toBe("2 minutes");
  });
});
