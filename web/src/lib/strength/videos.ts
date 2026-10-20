// Where a suggestion's video comes from (Phase 6, P6-02, decision D37).
// Stage 1: a YouTube search for the suggestion's words, which opens the
// YouTube app on a phone. No key, no quota, no server.

import type { Suggestion } from "./insights";

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/** The link to open for a suggestion. */
export function videoLinkFor(suggestion: Pick<Suggestion, "query">): string {
  return youtubeSearchUrl(suggestion.query);
}
