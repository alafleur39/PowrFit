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
import { overpassQuery, parseOverpass } from "@/lib/gyms/osm";
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

async function geocode(place: string): Promise<{ lat: number; lon: number } | null> {
  if (FAKE) return fakeGeocode(place);
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(place)}`;
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Place search failed (${response.status})`);
  const [first] = (await response.json()) as { lat?: string; lon?: string }[];
  const lat = Number(first?.lat);
  const lon = Number(first?.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

async function gymsAround(lat: number, lon: number): Promise<Gym[]> {
  if (FAKE) return fakeGyms(lat, lon);
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
    body: `data=${encodeURIComponent(overpassQuery(lat, lon))}`,
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Gym search failed (${response.status})`);
  return parseOverpass(await response.json());
}

export async function GET(request: Request): Promise<Response> {
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
      const point = await geocode(place ?? "");
      if (!point) return json(404, { error: "Couldn't find that place." });
      cell = encodeGeohash(point.lat, point.lon);
    }
    const center = decodeGeohash(cell);
    const gyms = await gymsAround(center.lat, center.lon);
    return json(200, { cell, center, gyms }, true);
  } catch (error) {
    console.error("Gym search failed", error);
    return json(502, { error: "The map service didn't answer. Try again in a minute." });
  }
}
