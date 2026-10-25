// OpenStreetMap as the gym provider (P6-05, D36 provider choice). Pure:
// builds the Overpass query and turns its answer into gyms. The fetching
// happens on the server, in app/api/gyms/route.ts.

import type { Gym } from "./gyms";

/** Search radius around a cell's centre. */
export const SEARCH_RADIUS_M = 5000;
/** Most gyms returned for one cell. */
export const MAX_GYMS = 50;

export function overpassQuery(lat: number, lon: number, radiusM = SEARCH_RADIUS_M): string {
  const around = `around:${radiusM},${lat.toFixed(5)},${lon.toFixed(5)}`;
  return `[out:json][timeout:8];(nwr["leisure"="fitness_centre"](${around});nwr["amenity"="gym"](${around}););out center ${MAX_GYMS};`;
}

type Element = {
  type?: unknown;
  id?: unknown;
  lat?: unknown;
  lon?: unknown;
  center?: { lat?: unknown; lon?: unknown };
  tags?: Record<string, unknown>;
};

const text = (value: unknown) => (typeof value === "string" && value.trim() !== "" ? value.trim() : undefined);

/** Overpass JSON to gyms: named ones only, one per element, capped. */
export function parseOverpass(json: unknown): Gym[] {
  const elements = (json as { elements?: unknown })?.elements;
  if (!Array.isArray(elements)) return [];
  const gyms: Gym[] = [];
  const seen = new Set<string>();
  for (const element of elements as Element[]) {
    const kind = element.type;
    if (kind !== "node" && kind !== "way" && kind !== "relation") continue;
    if (typeof element.id !== "number" || !Number.isInteger(element.id)) continue;
    const lat = typeof element.lat === "number" ? element.lat : element.center?.lat;
    const lon = typeof element.lon === "number" ? element.lon : element.center?.lon;
    const name = text(element.tags?.name);
    if (typeof lat !== "number" || typeof lon !== "number" || !name) continue;
    const placeId = `osm-${kind}-${element.id}`;
    if (seen.has(placeId)) continue;
    seen.add(placeId);
    const street = [text(element.tags?.["addr:housenumber"]), text(element.tags?.["addr:street"])].filter(Boolean).join(" ");
    gyms.push({ placeId, name: name.slice(0, 100), lat, lon, ...(street && { address: street.slice(0, 120) }) });
    if (gyms.length >= MAX_GYMS) break;
  }
  return gyms;
}

// Nominatim, OpenStreetMap's place search, as the first source. Public
// Overpass servers refuse requests from Netlify's network, while Nominatim
// answers them. Its [leisure=fitness_centre] phrase searches the same map
// data by category, bounded to a box around the point.

/** Nominatim's search URL for gyms in a box about radiusM from the point. */
export function nominatimGymsUrl(lat: number, lon: number, radiusM = SEARCH_RADIUS_M): string {
  const dLat = radiusM / 111_320;
  const dLon = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  const box = [lon - dLon, lat + dLat, lon + dLon, lat - dLat].map((n) => n.toFixed(5)).join(",");
  const q = encodeURIComponent("[leisure=fitness_centre]");
  return `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&bounded=1&limit=${MAX_GYMS}&viewbox=${box}&q=${q}`;
}

type Place = {
  osm_type?: unknown;
  osm_id?: unknown;
  lat?: unknown;
  lon?: unknown;
  name?: unknown;
  address?: { house_number?: unknown; road?: unknown };
};

/** Nominatim JSON to gyms, with the same place ids Overpass gives. */
export function parseNominatim(json: unknown): Gym[] {
  if (!Array.isArray(json)) return [];
  const elements = (json as Place[]).map((place) => ({
    type: place.osm_type,
    id: place.osm_id,
    lat: typeof place.lat === "string" ? Number(place.lat) : place.lat,
    lon: typeof place.lon === "string" ? Number(place.lon) : place.lon,
    tags: { name: place.name, "addr:housenumber": place.address?.house_number, "addr:street": place.address?.road },
  }));
  return parseOverpass({ elements });
}
