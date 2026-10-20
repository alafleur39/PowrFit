import { describe, expect, it } from "vitest";

import { VIDEO_LIBRARY, isWatchUrl, videoLinkFor, youtubeSearchUrl } from "@/lib/strength";

describe("video links", () => {
  it("searches YouTube for a suggestion's words", () => {
    expect(youtubeSearchUrl("bench press form & cues")).toBe(
      "https://www.youtube.com/results?search_query=bench%20press%20form%20%26%20cues"
    );
  });

  it("prefers the curated library, then falls back to search", () => {
    const library = { beginner: { title: "Basics", url: "https://www.youtube.com/watch?v=abcdefghijk" } };
    expect(videoLinkFor({ topic: "beginner", query: "x" }, library)).toBe(library.beginner.url);
    expect(videoLinkFor({ topic: "comeback", query: "get back" }, library)).toBe(youtubeSearchUrl("get back"));
  });

  it("only accepts YouTube watch links", () => {
    expect(isWatchUrl("https://www.youtube.com/watch?v=oYxTTirKY8M")).toBe(true);
    expect(isWatchUrl("https://www.youtube.com/watch?v=oYxTTirKY8M&t=1815s")).toBe(true);
    expect(isWatchUrl("http://www.youtube.com/watch?v=oYxTTirKY8M")).toBe(false);
    expect(isWatchUrl("https://evil.example/watch?v=oYxTTirKY8M")).toBe(false);
  });

  it("every curated entry is a YouTube watch link", () => {
    for (const [topic, video] of Object.entries(VIDEO_LIBRARY)) {
      expect(isWatchUrl(video.url), topic).toBe(true);
      expect(video.title.trim(), topic).not.toBe("");
    }
  });
});
