// YouTube Data API v3 requests and responses (V-02). Pure: builds URLs and
// reads JSON, so it's tested without the network. The key is only ever put
// into URLs on the server (D34).
//
// One topic costs 101 quota units: search.list (100) for candidates, then
// videos.list (1) for their length and whether they can be embedded.

import type { CuratedVideo } from "@/lib/strength";

/** A video as the app shows it. */
export type Video = {
  videoId: string;
  title: string;
  channel: string;
  /** 320×180 thumbnail on i.ytimg.com. */
  thumbnail: string;
  /** 0 for a curated pick, whose length isn't looked up. */
  durationSec: number;
};

const API = "https://www.googleapis.com/youtube/v3";

/** Videos shown per topic (D50). */
export const VIDEOS_PER_TOPIC = 3;
/** Search results to fetch, so a few can be filtered out and 3 still remain. */
export const SEARCH_RESULTS = 10;
/** Shorts run up to 3 minutes and rarely teach form; very long videos rarely suit a quick look between sets. */
export const MIN_DURATION_SEC = 2 * 60;
export const MAX_DURATION_SEC = 30 * 60;

export const VIDEO_ID = /^[\w-]{11}$/;

export function searchUrl(query: string, key: string): string {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    q: query,
    maxResults: String(SEARCH_RESULTS),
    safeSearch: "strict",
    videoEmbeddable: "true",
    relevanceLanguage: "en",
    key,
  });
  return `${API}/search?${params}`;
}

export function detailsUrl(videoIds: readonly string[], key: string): string {
  const params = new URLSearchParams({ part: "contentDetails,status", id: videoIds.join(","), key });
  return `${API}/videos?${params}`;
}

export const thumbnailUrl = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };

/** The API returns titles HTML-escaped ("Don&#39;t"); the app shows plain text. */
export function decodeEntities(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, name: string) => ENTITIES[name]);
}

/** "PT1H2M3S" → 3723. Null for anything else (live streams report "P0D"). */
export function parseIsoDuration(value: string): number | null {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!match || value === "PT") return null;
  const [, h = "0", m = "0", s = "0"] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

type Candidate = Omit<Video, "durationSec">;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Search results in YouTube's order; malformed items are skipped. */
export function parseSearch(json: unknown): Candidate[] {
  const items = isObject(json) && Array.isArray(json.items) ? json.items : [];
  const result: Candidate[] = [];
  for (const item of items) {
    if (!isObject(item) || !isObject(item.id) || !isObject(item.snippet)) continue;
    const { videoId } = item.id;
    const { title, channelTitle } = item.snippet;
    if (typeof videoId !== "string" || !VIDEO_ID.test(videoId)) continue;
    if (typeof title !== "string" || typeof channelTitle !== "string") continue;
    result.push({
      videoId,
      title: decodeEntities(title),
      channel: decodeEntities(channelTitle),
      thumbnail: thumbnailUrl(videoId),
    });
  }
  return result;
}

/** Length in seconds of each embeddable video, by id. */
export function parseDetails(json: unknown): Map<string, number> {
  const items = isObject(json) && Array.isArray(json.items) ? json.items : [];
  const result = new Map<string, number>();
  for (const item of items) {
    if (!isObject(item) || typeof item.id !== "string") continue;
    if (!isObject(item.status) || item.status.embeddable !== true) continue;
    if (!isObject(item.contentDetails) || typeof item.contentDetails.duration !== "string") continue;
    const seconds = parseIsoDuration(item.contentDetails.duration);
    if (seconds !== null) result.set(item.id, seconds);
  }
  return result;
}

/** The first VIDEOS_PER_TOPIC candidates that embed and are a sensible length. */
export function pickVideos(candidates: readonly Candidate[], durations: ReadonlyMap<string, number>): Video[] {
  return candidates
    .flatMap((candidate) => {
      const durationSec = durations.get(candidate.videoId);
      if (durationSec === undefined || durationSec < MIN_DURATION_SEC || durationSec > MAX_DURATION_SEC) return [];
      return [{ ...candidate, durationSec }];
    })
    .slice(0, VIDEOS_PER_TOPIC);
}

/** A hand-picked library video in the same shape (its length isn't looked up). */
export function curatedToVideo(curated: CuratedVideo): Video | null {
  const videoId = new URL(curated.url).searchParams.get("v");
  if (!videoId || !VIDEO_ID.test(videoId)) return null;
  return { videoId, title: curated.title, channel: curated.channel, thumbnail: thumbnailUrl(videoId), durationSec: 0 };
}

/** YouTube's answer when the day's quota is spent. */
export function isQuotaError(status: number, json: unknown): boolean {
  if (status !== 403 || !isObject(json) || !isObject(json.error) || !Array.isArray(json.error.errors)) return false;
  return json.error.errors.some(
    (error) => isObject(error) && (error.reason === "quotaExceeded" || error.reason === "dailyLimitExceeded")
  );
}
