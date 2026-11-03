import { describe, expect, it, vi } from "vitest";

import { findVideos, type Fetch } from "./find-videos";

const ID = (n: number) => `aaaaaaaaaa${n}`;
const reply = (status: number, json: unknown) => Promise.resolve({ status, ok: status < 400, json: () => Promise.resolve(json) });
const search = { items: [1, 2, 3, 4].map((n) => ({ id: { videoId: ID(n) }, snippet: { title: `V${n}`, channelTitle: "C" } })) };
const details = {
  items: [1, 2, 3, 4].map((n) => ({ id: ID(n), contentDetails: { duration: "PT5M" }, status: { embeddable: true } })),
};

const options = (fetch: ReturnType<typeof vi.fn>, extra = {}) => ({
  key: "SECRET",
  fetch: fetch as unknown as Fetch,
  deadline: Date.now() + 8_000,
  library: {},
  ...extra,
});

describe("findVideos", () => {
  it("searches with the topic's words, then keeps three good videos", async () => {
    const fetch = vi.fn().mockReturnValueOnce(reply(200, search)).mockReturnValueOnce(reply(200, details));
    const result = await findVideos("plateau:barbell-bench-press", options(fetch));
    expect(result).toMatchObject({ kind: "videos", source: "youtube" });
    expect(result.kind === "videos" && result.videos.map((video) => video.videoId)).toEqual([ID(1), ID(2), ID(3)]);
    expect(new URL(fetch.mock.calls[0][0]).searchParams.get("q")).toBe("how to break a barbell bench press plateau");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("uses a curated pick without calling YouTube", async () => {
    const fetch = vi.fn();
    const library = { beginner: { title: "Basics", url: "https://www.youtube.com/watch?v=abcdefghijk", channel: "Coach" } };
    const result = await findVideos("beginner", options(fetch, { library }));
    expect(result).toMatchObject({ kind: "videos", source: "library", videos: [{ videoId: "abcdefghijk" }] });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports a spent quota from either call", async () => {
    const quota = { error: { errors: [{ reason: "quotaExceeded" }] } };
    expect(await findVideos("beginner", options(vi.fn().mockReturnValueOnce(reply(403, quota))))).toEqual({ kind: "quota" });
    const second = vi.fn().mockReturnValueOnce(reply(200, search)).mockReturnValueOnce(reply(403, quota));
    expect(await findVideos("beginner", options(second))).toEqual({ kind: "quota" });
  });

  it("skips the second call when the search finds nothing", async () => {
    const fetch = vi.fn().mockReturnValueOnce(reply(200, { items: [] }));
    expect(await findVideos("beginner", options(fetch))).toEqual({ kind: "videos", source: "youtube", videos: [] });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("reports failures without leaking the key", async () => {
    const bad = await findVideos("beginner", options(vi.fn().mockReturnValueOnce(reply(400, {}))));
    expect(bad).toEqual({ kind: "error", detail: "search 400" });
    const thrown = await findVideos(
      "beginner",
      options(vi.fn().mockRejectedValueOnce(new TypeError("fetch failed for https://x/?key=SECRET")))
    );
    expect(thrown).toEqual({ kind: "error", detail: "TypeError" });
    expect(JSON.stringify(thrown)).not.toContain("SECRET");
  });

  it("doesn't start a call it has no time left for", async () => {
    const fetch = vi.fn();
    const result = await findVideos("beginner", options(fetch, { deadline: Date.now() + 100 }));
    expect(result).toMatchObject({ kind: "error" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refuses a topic outside the allowlist", async () => {
    await expect(findVideos("how to bench 500", options(vi.fn()))).rejects.toThrow(RangeError);
  });

  it("answers from the fake provider in browser tests", async () => {
    const fetch = vi.fn();
    const result = await findVideos("beginner", options(fetch, { fake: true }));
    expect(result.kind === "videos" && result.videos[0].title).toBe("beginner strength training program explained (1)");
    expect(fetch).not.toHaveBeenCalled();
  });
});
