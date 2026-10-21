"use client";

// Calls GET /api/gyms (P6-05) from the phone. Near me sends only the ~1 km
// geohash cell, never the exact position (D35); the sign-in token proves
// the caller is a PowrFit user.

import type { User } from "firebase/auth";

import { encodeGeohash } from "./geohash";
import type { Gym } from "./gyms";

export type GymSearch = { kind: "near"; lat: number; lon: number } | { kind: "place"; place: string };

export type GymSearchResult = {
  cell: string;
  /** Centre of the searched cell. */
  center: { lat: number; lon: number };
  gyms: Gym[];
};

export class GymSearchError extends Error {}

export async function searchGyms(user: User, search: GymSearch): Promise<GymSearchResult> {
  const query =
    search.kind === "near"
      ? `cell=${encodeGeohash(search.lat, search.lon)}`
      : `place=${encodeURIComponent(search.place.trim())}`;
  let response: Response;
  try {
    response = await fetch(`/api/gyms?${query}`, {
      headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    });
  } catch {
    throw new GymSearchError("Finding gyms needs a connection. Connect to the internet and try again.");
  }
  const body = (await response.json().catch(() => ({}))) as Partial<GymSearchResult> & { error?: string };
  if (!response.ok || !Array.isArray(body.gyms) || !body.center || !body.cell) {
    throw new GymSearchError(body.error ?? "Something went wrong finding gyms. Try again in a minute.");
  }
  return { cell: body.cell, center: body.center, gyms: body.gyms };
}
