import { describe, expect, it } from "vitest";

import { embedUrl, formatVideoLength, watchUrl } from "./video-api";

describe("video links", () => {
  it("plays inline in the privacy-enhanced player", () => {
    expect(embedUrl("abcdefghijk")).toBe(
      "https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1&playsinline=1&rel=0&modestbranding=1"
    );
    expect(watchUrl("abcdefghijk")).toBe("https://www.youtube.com/watch?v=abcdefghijk");
  });

  it("formats a video's length", () => {
    expect(formatVideoLength(253)).toBe("4:13");
    expect(formatVideoLength(725)).toBe("12:05");
    expect(formatVideoLength(60)).toBe("1:00");
  });
});
