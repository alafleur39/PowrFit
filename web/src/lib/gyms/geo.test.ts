import { describe, expect, it } from "vitest";

import { decodeGeohash, encodeGeohash, isCell } from "./geohash";
import { nominatimGymsUrl, overpassQuery, parseNominatim, parseOverpass } from "./osm";

describe("geohash", () => {
  it("encodes a known point and decodes near it", () => {
    // Times Square, a standard geohash example area.
    const cell = encodeGeohash(40.758, -73.9855);
    expect(cell).toBe("dr5ru7");
    const { lat, lon } = decodeGeohash(cell);
    expect(Math.abs(lat - 40.758)).toBeLessThan(0.01);
    expect(Math.abs(lon + 73.9855)).toBeLessThan(0.01);
  });

  it("only accepts 6-letter cells", () => {
    expect(isCell("dr5ru7")).toBe(true);
    expect(isCell("dr5ru")).toBe(false);
    expect(isCell("dr5rua")).toBe(false); // "a" isn't in the alphabet
    expect(isCell("DR5RU7")).toBe(false);
  });
});

describe("OpenStreetMap", () => {
  it("asks for gyms around a point", () => {
    const query = overpassQuery(40.758, -73.9855);
    expect(query).toContain('nwr["leisure"="fitness_centre"](around:5000,40.75800,-73.98550)');
    expect(query).toContain("out center 50");
  });

  it("keeps named gyms with a position, once each", () => {
    const gyms = parseOverpass({
      elements: [
        { type: "node", id: 1, lat: 40.7, lon: -73.9, tags: { name: "Iron Den", "addr:housenumber": "12", "addr:street": "Main St" } },
        { type: "way", id: 2, center: { lat: 40.71, lon: -73.91 }, tags: { name: "Lift House" } },
        { type: "node", id: 1, lat: 40.7, lon: -73.9, tags: { name: "Iron Den" } },
        { type: "node", id: 3, lat: 40.7, lon: -73.9, tags: {} },
        { type: "area", id: 4, lat: 40.7, lon: -73.9, tags: { name: "Odd" } },
      ],
    });
    expect(gyms).toEqual([
      { placeId: "osm-node-1", name: "Iron Den", lat: 40.7, lon: -73.9, address: "12 Main St" },
      { placeId: "osm-way-2", name: "Lift House", lat: 40.71, lon: -73.91 },
    ]);
    expect(parseOverpass({ nope: true })).toEqual([]);
  });

  it("searches Nominatim by category inside a box around the point", () => {
    const url = new URL(nominatimGymsUrl(40.758, -73.9855));
    expect(url.searchParams.get("q")).toBe("[leisure=fitness_centre]");
    expect(url.searchParams.get("bounded")).toBe("1");
    const [west, north, east, south] = url.searchParams.get("viewbox")!.split(",").map(Number);
    expect(north - 40.758).toBeCloseTo(0.0449, 3); // 5 km
    expect(40.758 - south).toBeCloseTo(0.0449, 3);
    expect(east + 73.9855).toBeGreaterThan(0.0449); // longitude degrees are shorter
    expect(-73.9855 - west).toBeCloseTo(east + 73.9855, 5);
  });

  it("reads Nominatim places with the same ids as Overpass", () => {
    const gyms = parseNominatim([
      { osm_type: "node", osm_id: 1, lat: "40.7", lon: "-73.9", name: "Iron Den", address: { house_number: "12", road: "Main St" } },
      { osm_type: "way", osm_id: 2, lat: "40.71", lon: "-73.91", name: "Lift House", address: {} },
      { osm_type: "node", osm_id: 3, lat: "40.7", lon: "-73.9", name: "" },
    ]);
    expect(gyms).toEqual([
      { placeId: "osm-node-1", name: "Iron Den", lat: 40.7, lon: -73.9, address: "12 Main St" },
      { placeId: "osm-way-2", name: "Lift House", lat: 40.71, lon: -73.91 },
    ]);
    expect(parseNominatim({ error: "x" })).toEqual([]);
  });
});
