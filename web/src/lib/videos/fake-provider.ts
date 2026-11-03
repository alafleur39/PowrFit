// A stand-in for YouTube in browser tests (V-02), switched on by
// VIDEOS_PROVIDER=fake outside production. Three videos named after the
// search words, so a test can tell topics apart.

import { thumbnailUrl, type Video } from "./youtube";

export function fakeVideos(query: string): Video[] {
  return ["aaaaaaaaaa1", "aaaaaaaaaa2", "aaaaaaaaaa3"].map((videoId, i) => ({
    videoId,
    title: `${query} (${i + 1})`,
    channel: "Test Coach",
    thumbnail: thumbnailUrl(videoId),
    durationSec: 300 + i * 60,
  }));
}
