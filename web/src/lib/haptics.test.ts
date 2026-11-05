import { beforeEach, describe, expect, it, vi } from "vitest";

const plugin = vi.hoisted(() => ({
  impact: vi.fn(() => Promise.resolve()),
  notification: vi.fn(() => Promise.resolve()),
}));
const platform = vi.hoisted(() => ({ native: false, available: false }));

vi.mock("@capacitor/core", () => ({
  registerPlugin: () => plugin,
  Capacitor: {
    isNativePlatform: () => platform.native,
    isPluginAvailable: () => platform.available,
  },
}));

import { haptic } from "./haptics";

describe("haptic", () => {
  beforeEach(() => {
    plugin.impact.mockClear();
    plugin.notification.mockClear();
  });

  it("does nothing on the website", () => {
    platform.native = false;
    platform.available = true;
    haptic("success");
    expect(plugin.notification).not.toHaveBeenCalled();
  });

  it("does nothing in the app until the Haptics plugin is installed", () => {
    platform.native = true;
    platform.available = false;
    haptic("warning");
    expect(plugin.notification).not.toHaveBeenCalled();
  });

  it("maps each kind to the iOS feedback", () => {
    platform.native = true;
    platform.available = true;
    haptic("selection");
    haptic("success");
    haptic("warning");
    expect(plugin.impact).toHaveBeenCalledWith({ style: "LIGHT" });
    expect(plugin.notification).toHaveBeenNthCalledWith(1, { type: "SUCCESS" });
    expect(plugin.notification).toHaveBeenNthCalledWith(2, { type: "WARNING" });
  });

  it("never throws when the plugin fails", async () => {
    platform.native = true;
    platform.available = true;
    plugin.notification.mockReturnValueOnce(Promise.reject(new Error("no engine")));
    expect(() => haptic("success")).not.toThrow();
    await Promise.resolve();
  });
});
