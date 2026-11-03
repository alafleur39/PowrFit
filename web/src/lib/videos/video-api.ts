"use client";

// Calls GET /api/videos (V-02) from the phone. Only the topic is sent (D37);
// the sign-in token proves the caller is a PowrFit user. Answers are kept
// for the session, so going back to Home doesn't ask again (D39); a failed
// call is forgotten, so the next visit tries again.

import type { User } from "firebase/auth";

import { apiUrl } from "@/lib/routes";

import type { Video } from "./youtube";

const session = new Map<string, Promise<Video[]>>();

async function request(user: User, topic: string): Promise<Video[]> {
  const response = await fetch(apiUrl(`/api/videos?topic=${encodeURIComponent(topic)}`), {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
  });
  const body = (await response.json().catch(() => ({}))) as { videos?: unknown };
  if (!response.ok || !Array.isArray(body.videos)) throw new Error(`Videos failed (${response.status})`);
  // An empty list (quota spent, nothing suitable) means "use the search link".
  return body.videos as Video[];
}

/** The topic's videos; [] when there are none to show. Rejects when the call fails. */
export function topicVideos(user: User, topic: string): Promise<Video[]> {
  const key = `${user.uid}:${topic}`;
  let pending = session.get(key);
  if (!pending) {
    pending = request(user, topic);
    session.set(key, pending);
    pending.catch(() => session.delete(key));
  }
  return pending;
}

/** The privacy-enhanced player (D49): no YouTube cookies until the video plays. */
export function embedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
}

export const watchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;

/** "4:13", "12:05". */
export function formatVideoLength(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
