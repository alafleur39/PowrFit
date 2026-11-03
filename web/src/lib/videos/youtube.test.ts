import { describe, expect, it } from "vitest";

import {
  curatedToVideo,
  decodeEntities,
  detailsUrl,
  isQuotaError,
  parseDetails,
  parseIsoDuration,
  parseSearch,
  pickVideos,
  searchUrl,
} from "./youtube";

const searchItem = (videoId: string, title = `Video ${videoId}`) => ({
  id: { kind: "youtube#video", videoId },
  snippet: { title, channelTitle: "Coach &amp; Co" },
});
const detail = (id: string, duration: string, embeddable = true) => ({
  id,
  contentDetails: { duration },
  status: { embeddable },
});

describe("request URLs", () => {
  it("asks for safe, embeddable English videos with the server's words", () => {
    const url = new URL(searchUrl("how to break a bench press plateau", "KEY"));
    expect(url.origin + url.pathname).toBe("https://www.googleapis.com/youtube/v3/search");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      part: "snippet",
      type: "video",
      q: "how to break a bench press plateau",
      maxResults: "10",
      safeSearch: "strict",
      videoEmbeddable: "true",
      relevanceLanguage: "en",
      key: "KEY",
    });
  });

  it("looks up length and embedding for all candidates in one call", () => {
    const url = new URL(detailsUrl(["aaaaaaaaaa1", "aaaaaaaaaa2"], "KEY"));
    expect(url.searchParams.get("id")).toBe("aaaaaaaaaa1,aaaaaaaaaa2");
    expect(url.searchParams.get("part")).toBe("contentDetails,status");
  });
});

describe("parsing", () => {
  it("decodes the HTML escapes YouTube puts in titles", () => {
    expect(decodeEntities("Don&#39;t &quot;ego lift&quot; &amp; &lt;3")).toBe(`Don't "ego lift" & <3`);
  });

  it("reads ISO 8601 durations", () => {
    expect(parseIsoDuration("PT4M13S")).toBe(253);
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(parseIsoDuration("PT45S")).toBe(45);
    expect(parseIsoDuration("P0D")).toBeNull();
    expect(parseIsoDuration("PT")).toBeNull();
  });

  it("keeps well-formed search results in order and skips the rest", () => {
    const json = {
      items: [
        searchItem("aaaaaaaaaa1", "Bench &amp; you"),
        { id: { kind: "youtube#channel", channelId: "x" }, snippet: { title: "A channel", channelTitle: "x" } },
        searchItem("bad id"),
        searchItem("aaaaaaaaaa2"),
      ],
    };
    expect(parseSearch(json)).toEqual([
      { videoId: "aaaaaaaaaa1", title: "Bench & you", channel: "Coach & Co", thumbnail: "https://i.ytimg.com/vi/aaaaaaaaaa1/mqdefault.jpg" },
      { videoId: "aaaaaaaaaa2", title: "Video aaaaaaaaaa2", channel: "Coach & Co", thumbnail: "https://i.ytimg.com/vi/aaaaaaaaaa2/mqdefault.jpg" },
    ]);
    expect(parseSearch(null)).toEqual([]);
    expect(parseSearch({ items: "nope" })).toEqual([]);
  });

  it("only keeps details for embeddable videos with a length", () => {
    const durations = parseDetails({
      items: [detail("aaaaaaaaaa1", "PT5M"), detail("aaaaaaaaaa2", "PT5M", false), detail("aaaaaaaaaa3", "P0D")],
    });
    expect([...durations]).toEqual([["aaaaaaaaaa1", 300]]);
  });
});

describe("pickVideos", () => {
  it("drops Shorts-length and very long videos and keeps the first three", () => {
    const ids = ["aaaaaaaaaa1", "aaaaaaaaaa2", "aaaaaaaaaa3", "aaaaaaaaaa4", "aaaaaaaaaa5", "aaaaaaaaaa6"];
    const candidates = parseSearch({ items: ids.map((id) => searchItem(id)) });
    const durations = parseDetails({
      items: [
        detail(ids[0], "PT59S"),
        detail(ids[1], "PT8M"),
        detail(ids[2], "PT45M"),
        detail(ids[3], "PT2M"),
        detail(ids[4], "PT30M"),
        detail(ids[5], "PT6M"),
      ],
    });
    expect(pickVideos(candidates, durations).map((video) => [video.videoId, video.durationSec])).toEqual([
      ["aaaaaaaaaa2", 480],
      ["aaaaaaaaaa4", 120],
      ["aaaaaaaaaa5", 1800],
    ]);
  });
});

describe("curated and quota", () => {
  it("turns a curated library entry into a video", () => {
    expect(
      curatedToVideo({ title: "Bench basics", url: "https://www.youtube.com/watch?v=abcdefghijk&t=30s", channel: "Coach" })
    ).toEqual({
      videoId: "abcdefghijk",
      title: "Bench basics",
      channel: "Coach",
      thumbnail: "https://i.ytimg.com/vi/abcdefghijk/mqdefault.jpg",
      durationSec: 0,
    });
  });

  it("recognises a spent quota and nothing else", () => {
    const quota = { error: { code: 403, errors: [{ reason: "quotaExceeded" }] } };
    expect(isQuotaError(403, quota)).toBe(true);
    expect(isQuotaError(403, { error: { errors: [{ reason: "forbidden" }] } })).toBe(false);
    expect(isQuotaError(500, quota)).toBe(false);
  });
});
