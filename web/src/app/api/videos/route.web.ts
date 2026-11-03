// GET /api/videos?topic=plateau:barbell-bench-press (V-02): up to three
// YouTube videos for a "For you" suggestion. Website only, like /api/gyms;
// the iOS build calls it on Netlify.
//
// Only topics from video-topics.ts are accepted, and the search words are
// built here, never taken from the request. The YouTube key is a server
// environment variable (D34). Answers are cached per topic: a day on the
// phone, 7 days on Netlify's CDN (D50), so one search serves every user with
// that topic and the free quota (about 100 searches a day) goes a long way.
// Only signed-in users get past the cache to YouTube.

import { isVideoTopic } from "@/lib/strength";
import { CORS_ORIGIN, preflight } from "@/lib/server/cors";
import { verifyIdToken } from "@/lib/server/id-token";
import { findVideos } from "@/lib/videos/find-videos";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
const PRODUCTION = process.env.NODE_ENV === "production";
/** Test switches, never honoured in production. */
// GYMS_TRUST_EMULATOR_TOKENS is shared with /api/gyms.
const EMULATOR = !PRODUCTION && process.env.GYMS_TRUST_EMULATOR_TOKENS === "1";
const FAKE = !PRODUCTION && process.env.VIDEOS_PROVIDER === "fake";
/** Netlify's functions stop at 10 seconds. */
const REQUEST_BUDGET_MS = 8_000;

type Cache = "videos" | "quota" | "none";

const CACHE_HEADERS: Record<Cache, Record<string, string>> = {
  videos: {
    "Cache-Control": "public, max-age=86400",
    "Netlify-CDN-Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
    "Netlify-Vary": "query=topic",
  },
  // Quota spent: everyone with this topic gets the search-link fallback for
  // an hour instead of asking YouTube again.
  quota: {
    "Cache-Control": "public, max-age=3600",
    "Netlify-CDN-Cache-Control": "public, s-maxage=3600",
    "Netlify-Vary": "query=topic",
  },
  none: { "Cache-Control": "no-store" },
};

function json(status: number, body: unknown, cache: Cache = "none"): Response {
  return Response.json(body, { status, headers: { ...CORS_ORIGIN, ...CACHE_HEADERS[cache] } });
}

export const OPTIONS = preflight;

export async function GET(request: Request): Promise<Response> {
  const deadline = Date.now() + REQUEST_BUDGET_MS;
  const topic = new URL(request.url).searchParams.get("topic") ?? "";
  if (!isVideoTopic(topic)) return json(400, { error: "Unknown topic." });

  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const uid = token ? await verifyIdToken(token, { projectId: PROJECT_ID, emulator: EMULATOR }) : null;
  if (!uid) return json(401, { error: "Sign in to see videos." });

  const key = process.env.YOUTUBE_API_KEY ?? "";
  if (!key && !FAKE) {
    console.error("Video search is not set up: YOUTUBE_API_KEY is missing");
    return json(503, { error: "Videos aren't available right now." });
  }

  const result = await findVideos(topic, { key, fetch, deadline, fake: FAKE });
  if (result.kind === "videos") return json(200, { topic, source: result.source, videos: result.videos }, "videos");
  if (result.kind === "quota") return json(200, { topic, source: "none", videos: [] }, "quota");
  console.error("Video search failed", topic, result.detail);
  return json(502, { error: "YouTube didn't answer. Try again in a minute." });
}
