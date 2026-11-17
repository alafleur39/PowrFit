import { Capacitor, registerPlugin } from "@capacitor/core";
import type { GeolocationPlugin } from "@capacitor/geolocation";

import { GymSearchError } from "./gym-api";

// Your position for Near me. In the iOS app it comes from
// @capacitor/geolocation, so iOS asks once, as "PowrFit", with the reason in
// Info.plist. The web view's own location API would ask a second time as
// "localhost" (beta feedback, Nov 17). Websites use the browser's API.
// Registered by name, like haptics, so the website bundle carries none of the
// plugin's code.

const Geolocation = registerPlugin<GeolocationPlugin>("Geolocation");

export type Point = { lat: number; lon: number };

const DENIED = "Location is off for PowrFit. Search a city or zip code instead.";
const UNAVAILABLE = "Couldn't find your location. Search a city or zip code instead.";

/** Rough is enough: the position is rounded to a ~1 km cell before it leaves the phone. */
const OPTIONS = { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 };

export function locate(): Promise<Point> {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Geolocation")) return locateNative();
  return locateInBrowser();
}

async function locateNative(): Promise<Point> {
  try {
    let status = await Geolocation.checkPermissions();
    if (status.location === "prompt" || status.location === "prompt-with-rationale") {
      status = await Geolocation.requestPermissions({ permissions: ["location"] });
    }
    if (status.location === "denied") throw new GymSearchError(DENIED);
    const position = await Geolocation.getCurrentPosition(OPTIONS);
    return { lat: position.coords.latitude, lon: position.coords.longitude };
  } catch (error) {
    if (error instanceof GymSearchError) throw error;
    const code = (error as { code?: unknown } | null)?.code;
    // OS-PLUG-GLOC-0003: refused; 0007: Location Services off; 0008: restricted.
    if (code === "OS-PLUG-GLOC-0003" || code === "OS-PLUG-GLOC-0007" || code === "OS-PLUG-GLOC-0008") {
      throw new GymSearchError(DENIED);
    }
    throw new GymSearchError(UNAVAILABLE);
  }
}

function locateInBrowser(): Promise<Point> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new GymSearchError("This browser can't share your location. Search a city or zip code instead."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      (error) => reject(new GymSearchError(error.code === error.PERMISSION_DENIED ? DENIED : UNAVAILABLE)),
      OPTIONS
    );
  });
}
