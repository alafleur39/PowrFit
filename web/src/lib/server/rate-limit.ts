// Per-user request limits for PowrFit's own endpoints (Nov 2026 security
// review). A fixed window per user, kept in the function's memory.
//
// Netlify can run several copies of a function, each with its own memory,
// so this is a first line of defence, not an exact count: it stops one
// signed-in user from hammering an endpoint (and through it OpenStreetMap or
// YouTube) from a script, which mostly lands on the same warm copy. App
// Check (Phase 8) is the stronger fix.

import { CORS_ORIGIN } from "./cors";

export type RateLimit = { max: number; windowMs: number };

export type RateLimiter = {
  /** Counts one request; says whether it's allowed and, if not, when to retry. */
  take(uid: string, nowMs?: number): { allowed: true } | { allowed: false; retryAfterSec: number };
};

/** Above this many tracked users, finished windows are dropped first. */
const PRUNE_AT = 5_000;

export function createRateLimiter({ max, windowMs }: RateLimit): RateLimiter {
  const windows = new Map<string, { startedAt: number; count: number }>();

  return {
    take(uid, nowMs = Date.now()) {
      if (windows.size >= PRUNE_AT) {
        for (const [key, window] of windows) {
          if (nowMs - window.startedAt >= windowMs) windows.delete(key);
        }
      }
      const window = windows.get(uid);
      if (!window || nowMs - window.startedAt >= windowMs) {
        windows.set(uid, { startedAt: nowMs, count: 1 });
        return { allowed: true };
      }
      if (window.count < max) {
        window.count += 1;
        return { allowed: true };
      }
      return { allowed: false, retryAfterSec: Math.ceil((window.startedAt + windowMs - nowMs) / 1000) };
    },
  };
}

/** The 429 answer: never cached, readable by the iOS app, with when to retry. */
export function tooManyRequests(retryAfterSec: number, error: string): Response {
  return Response.json(
    { error },
    {
      status: 429,
      headers: { ...CORS_ORIGIN, "Cache-Control": "no-store", "Retry-After": String(retryAfterSec) },
    }
  );
}

/** "a minute" or "5 minutes", for messages. */
export function waitText(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes === 1 ? "a minute" : `${minutes} minutes`;
}
