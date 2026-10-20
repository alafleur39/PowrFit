// A stand-in for OpenStreetMap in browser tests (P6-06), switched on by
// GYMS_PROVIDER=fake outside production. Three gyms around any point, and
// one known place name.

import type { Gym } from "./gyms";

export const FAKE_PLACE = "Testville";
export const FAKE_PLACE_POINT = { lat: 40.758, lon: -73.9855 };

export function fakeGyms(lat: number, lon: number): Gym[] {
  return [
    { placeId: "osm-node-9001", name: "Iron Den", lat: lat + 0.004, lon, address: "12 Main St" },
    { placeId: "osm-node-9002", name: "Lift House", lat: lat + 0.02, lon: lon + 0.02 },
    { placeId: "osm-way-9003", name: "Corner Gym", lat: lat - 0.001, lon: lon - 0.001 },
  ];
}

export function fakeGeocode(place: string): { lat: number; lon: number } | null {
  return place.trim().toLowerCase() === FAKE_PLACE.toLowerCase() ? FAKE_PLACE_POINT : null;
}
