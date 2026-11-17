import { beforeEach, describe, expect, it, vi } from "vitest";

type Status = { location: string; coarseLocation: string };

const plugin = vi.hoisted(() => ({
  checkPermissions: vi.fn<() => Promise<Status>>(),
  requestPermissions: vi.fn<() => Promise<Status>>(),
  getCurrentPosition: vi.fn<() => Promise<{ coords: { latitude: number; longitude: number } }>>(),
}));
const platform = vi.hoisted(() => ({ native: true }));

vi.mock("@capacitor/core", () => ({
  registerPlugin: () => plugin,
  Capacitor: {
    isNativePlatform: () => platform.native,
    isPluginAvailable: () => platform.native,
  },
}));

import { GymSearchError } from "./gym-api";
import { locate } from "./locate";

const status = (location: string): Status => ({ location, coarseLocation: location });
const here = { coords: { latitude: 40.66, longitude: -73.71 } };

describe("locate in the iOS app", () => {
  beforeEach(() => {
    platform.native = true;
    vi.clearAllMocks();
    plugin.getCurrentPosition.mockResolvedValue(here);
  });

  it("asks iOS once, then uses the position", async () => {
    plugin.checkPermissions.mockResolvedValue(status("prompt"));
    plugin.requestPermissions.mockResolvedValue(status("granted"));
    await expect(locate()).resolves.toEqual({ lat: 40.66, lon: -73.71 });
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1);
  });

  it("doesn't ask again once allowed", async () => {
    plugin.checkPermissions.mockResolvedValue(status("granted"));
    await locate();
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
  });

  it("says how to search instead when location is refused", async () => {
    plugin.checkPermissions.mockResolvedValue(status("denied"));
    await expect(locate()).rejects.toThrow(/Location is off for PowrFit/);
    expect(plugin.getCurrentPosition).not.toHaveBeenCalled();
  });

  it("treats Location Services being off like a refusal", async () => {
    plugin.checkPermissions.mockResolvedValue(status("granted"));
    plugin.getCurrentPosition.mockRejectedValue({ code: "OS-PLUG-GLOC-0007" });
    await expect(locate()).rejects.toThrow(/Location is off for PowrFit/);
  });

  it("explains any other failure as a search error", async () => {
    plugin.checkPermissions.mockResolvedValue(status("granted"));
    plugin.getCurrentPosition.mockRejectedValue(new Error("timeout"));
    await expect(locate()).rejects.toBeInstanceOf(GymSearchError);
    await expect(locate()).rejects.toThrow(/Couldn't find your location/);
  });
});

describe("locate on the website", () => {
  it("uses the browser, not the plugin", async () => {
    platform.native = false;
    vi.clearAllMocks();
    const getCurrentPosition = vi.fn((ok: (position: typeof here) => void) => ok(here));
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    await expect(locate()).resolves.toEqual({ lat: 40.66, lon: -73.71 });
    expect(plugin.checkPermissions).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
