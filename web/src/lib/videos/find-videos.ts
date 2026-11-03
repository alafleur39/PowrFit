// Finds the videos for one topic (V-02): the curated library first, then a
// YouTube search. The network call is passed in, so quota errors, timeouts
// and filtering are unit-tested; the route handler supplies fetch and the key.

import { VIDEO_LIBRARY, videoQuery, type CuratedVideo } from "@/lib/strength";
import { fakeVideos } from "./fake-provider";
import {
  curatedToVideo,
  detailsUrl,
  isQuotaError,
  parseDetails,
  parseSearch,
  pickVideos,
  searchUrl,
  type Video,
} from "./youtube";

export type FindResult =
  /** Videos to show; "library" ones were picked by hand. */
  | { kind: "videos"; source: "library" | "youtube"; videos: Video[] }
  /** Today's quota is spent: the app falls back to a search link. */
  | { kind: "quota" }
  /** YouTube failed or was too slow. */
  | { kind: "error"; detail: string };

export type Fetch = (url: string, init: { signal: AbortSignal }) => Promise<Pick<Response, "status" | "ok" | "json">>;

export async function findVideos(
  topic: string,
  options: {
    key: string;
    fetch: Fetch;
    /** Epoch ms after which no new call starts. */
    deadline: number;
    library?: Readonly<Record<string, CuratedVideo>>;
    /** Browser tests: canned videos, no network. */
    fake?: boolean;
  }
): Promise<FindResult> {
  const query = videoQuery(topic);
  if (query === null) throw new RangeError(`Unknown topic: ${topic}`);

  const curated = (options.library ?? VIDEO_LIBRARY)[topic];
  const pick = curated && curatedToVideo(curated);
  if (pick) return { kind: "videos", source: "library", videos: [pick] };
  if (options.fake) return { kind: "videos", source: "youtube", videos: fakeVideos(query) };

  const call = async (url: string) => {
    const left = options.deadline - Date.now();
    if (left < 500) throw new Error("out of time");
    const response = await options.fetch(url, { signal: AbortSignal.timeout(Math.min(left, 4_000)) });
    return { status: response.status, ok: response.ok, json: (await response.json()) as unknown };
  };

  try {
    const search = await call(searchUrl(query, options.key));
    if (isQuotaError(search.status, search.json)) return { kind: "quota" };
    if (!search.ok) return { kind: "error", detail: `search ${search.status}` };
    const candidates = parseSearch(search.json);
    if (candidates.length === 0) return { kind: "videos", source: "youtube", videos: [] };

    const details = await call(detailsUrl(candidates.map((candidate) => candidate.videoId), options.key));
    if (isQuotaError(details.status, details.json)) return { kind: "quota" };
    if (!details.ok) return { kind: "error", detail: `videos ${details.status}` };
    return { kind: "videos", source: "youtube", videos: pickVideos(candidates, parseDetails(details.json)) };
  } catch (error) {
    // Never echo the URL: it holds the key.
    return { kind: "error", detail: error instanceof Error ? error.name : "unknown" };
  }
}
