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
