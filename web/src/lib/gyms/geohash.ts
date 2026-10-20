// Geohash cells (P6-05, D35). The phone turns its position into a 6-letter
// cell (about 1.2 km by 0.6 km) and sends only that, so the exact location
// never leaves the device, and everyone in a cell shares one cached answer.

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
export const CELL_PRECISION = 6;
const CELL = /^[0-9b-hjkmnp-z]{6}$/;

export function isCell(value: unknown): value is string {
  return typeof value === "string" && CELL.test(value);
}

export function encodeGeohash(lat: number, lon: number, precision = CELL_PRECISION): string {
  let latRange = [-90, 90];
  let lonRange = [-180, 180];
  let hash = "";
  let bits = 0;
  let value = 0;
  let even = true;
  while (hash.length < precision) {
    const range = even ? lonRange : latRange;
    const coordinate = even ? lon : lat;
    const mid = (range[0] + range[1]) / 2;
    value <<= 1;
    if (coordinate >= mid) {
      value |= 1;
      range[0] = mid;
    } else {
      range[1] = mid;
    }
    if (even) lonRange = range;
    else latRange = range;
    even = !even;
    bits += 1;
    if (bits === 5) {
      hash += BASE32.charAt(value);
      bits = 0;
      value = 0;
    }
  }
  return hash;
}

/** The centre of a cell. */
export function decodeGeohash(hash: string): { lat: number; lon: number } {
  const latRange = [-90, 90];
  const lonRange = [-180, 180];
  let even = true;
  for (const char of hash) {
    const value = BASE32.indexOf(char);
    if (value < 0) throw new RangeError(`Not a geohash: ${hash}`);
    for (let bit = 4; bit >= 0; bit -= 1) {
      const range = even ? lonRange : latRange;
      const mid = (range[0] + range[1]) / 2;
      if ((value >> bit) & 1) range[0] = mid;
      else range[1] = mid;
      even = !even;
    }
  }
  return { lat: (latRange[0] + latRange[1]) / 2, lon: (lonRange[0] + lonRange[1]) / 2 };
}
