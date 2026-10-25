// GET /api/gyms (P6-05): gyms on the map around a ~1 km cell, or around a
// place the user typed. PowrFit's first server endpoint: the phone sends a
// geohash cell, never its exact position (D35); only signed-in users get
// past the cache to the provider; prices are not added here, the phone
// reads them from Firestore itself.
//
//   ?cell=dr5ru7   six-letter geohash          ?place=Brooklyn   2-80 characters

import { decodeGeohash, encodeGeohash, isCell } from "@/lib/gyms/geohash";
import { fakeGeocode, fakeGyms } from "@/lib/gyms/fake-provider";
import type { Gym } from "@/lib/gyms/gyms";
import { nominatimGymsUrl, overpassQuery, parseNominatim, parseOverpass } from "@/lib/gyms/osm";
import { verifyIdToken } from "@/lib/server/id-token";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "";
const PRODUCTION = process.env.NODE_ENV === "production";
/** Test switches, never honoured in production. */
const EMULATOR = !PRODUCTION && process.env.GYMS_TRUST_EMULATOR_TOKENS === "1";
const FAKE = !PRODUCTION && process.env.GYMS_PROVIDER === "fake";

// OpenStreetMap's usage policies ask apps to identify themselves.
const USER_AGENT = "PowrFit/1.0 (https://powrfit-andylafleur.netlify.app)";

function json(status: number, body: unknown, cache = false): Response {
  return Response.json(body, {
    status,
    headers: cache
      ? {
          // The phone keeps an hour; Netlify's CDN keeps a day per cell or place.
          "Cache-Control": "public, max-age=3600",
          "Netlify-CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
          "Netlify-Vary": "query=cell|place",
        }
      : { "Cache-Control": "no-store" },
  });
}

async function geocode(place: string, deadline: number): Promise<{ lat: number; lon: number } | null> {
  if (FAKE) return fakeGeocode(place);
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(place)}`;
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(Math.max(1, Math.min(4_000, deadline - Date.now()))),
  });
  if (!response.ok) throw new Error(`Place search failed (${response.status})`);
  const [first] = (await response.json()) as { lat?: string; lon?: string }[];
  const lat = Number(first?.lat);
  const lon = Number(first?.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

// Public Overpass servers, tried in order: any one of them can be busy or
// refuse a network, and a single answer is enough.
const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
/** The whole request stays inside Netlify's 10 second function limit. */
const REQUEST_BUDGET_MS = 9_000;

async function gymsAround(lat: number, lon: number, deadline: number): Promise<Gym[]> {
  if (FAKE) return fakeGyms(lat, lon);
  // Nominatim first: Overpass servers have refused Netlify's network.
  const sources: { url: string; init: RequestInit; parse: (json: unknown) => Gym[] }[] = [
    { url: nominatimGymsUrl(lat, lon), init: { headers: { "User-Agent": USER_AGENT } }, parse: parseNominatim },
    ...OVERPASS_SERVERS.map((url) => ({
      url,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
        body: `data=${encodeURIComponent(overpassQuery(lat, lon))}`,
      },
      parse: parseOverpass,
    })),
  ];
  const failures: string[] = [];
  for (const source of sources) {
    const left = deadline - Date.now();
    if (left < 1_000) break;
    try {
      const response = await fetch(source.url, { ...source.init, signal: AbortSignal.timeout(Math.min(left, 4_000)) });
      if (!response.ok) throw new Error(String(response.status));
      return source.parse(await response.json());
    } catch (error) {
      failures.push(`${new URL(source.url).host}: ${error instanceof Error ? error.message : error}`);
    }
  }
  throw new Error(`Gym search failed (${failures.join("; ")})`);
}

export async function GET(request: Request): Promise<Response> {
  const deadline = Date.now() + REQUEST_BUDGET_MS;
  const params = new URL(request.url).searchParams;
  const cellParam = params.get("cell");
  const place = params.get("place")?.trim();

  if (cellParam !== null ? !isCell(cellParam) : !place || place.length < 2 || place.length > 80) {
    return json(400, { error: "Send a six-letter cell or a place of 2 to 80 characters." });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const uid = token ? await verifyIdToken(token, { projectId: PROJECT_ID, emulator: EMULATOR }) : null;
  if (!uid) return json(401, { error: "Sign in to search for gyms." });

  try {
    let cell = cellParam;
    if (!cell) {
      const point = await geocode(place ?? "", deadline);
      if (!point) return json(404, { error: "Couldn't find that place." });
      cell = encodeGeohash(point.lat, point.lon);
    }
    const center = decodeGeohash(cell);
    const gyms = await gymsAround(center.lat, center.lon, deadline);
    return json(200, { cell, center, gyms }, true);
  } catch (error) {
    console.error("Gym search failed", error);
    return json(502, { error: "The map service didn't answer. Try again in a minute." });
  }
}
