// Where a suggestion's video comes from (Phase 6, P6-02 and P6-03, D37).
//
// Stage 2: a curated library of vetted videos, keyed by suggestion topic.
// Stage 1 is the fallback: a YouTube search for the suggestion's words,
// which opens the YouTube app on a phone. No key, no quota, no server.

import type { Suggestion } from "./insights";

export type CuratedVideo = {
  /** As shown on YouTube, for whoever maintains the list. */
  title: string;
  /** https://www.youtube.com/watch?v=… (checked by videos.test.ts). */
  url: string;
};

/**
 * Vetted videos by topic: "beginner", "comeback", "balance:push-pull",
 * "plateau:<exerciseId>" or "form:<exerciseId>" (see insights.ts). Empty
 * until the owner picks coaches they trust (Phase 6 open question 4): a
 * wrong form video can injure someone, so entries are added by hand only.
 */
export const VIDEO_LIBRARY: Readonly<Record<string, CuratedVideo>> = {};

const WATCH_URL = /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}(&t=\d+s)?$/;

export function isWatchUrl(url: string): boolean {
  return WATCH_URL.test(url);
}

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/** The library's pick for a suggestion, else a YouTube search for it. */
export function videoLinkFor(
  suggestion: Pick<Suggestion, "topic" | "query">,
  library: Readonly<Record<string, CuratedVideo>> = VIDEO_LIBRARY
): string {
  return library[suggestion.topic]?.url ?? youtubeSearchUrl(suggestion.query);
}
