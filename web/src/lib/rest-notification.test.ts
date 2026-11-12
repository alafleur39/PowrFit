import { beforeEach, describe, expect, it, vi } from "vitest";

type ScheduledNotification = { id: number; title: string; schedule: { at: Date } };

const plugin = vi.hoisted(() => ({
  cancel: vi.fn(() => Promise.resolve()),
  schedule: vi.fn<(options: { notifications: ScheduledNotification[] }) => Promise<unknown>>(
    () => Promise.resolve({ notifications: [] })
  ),
}));
const platform = vi.hoisted(() => ({ native: true, available: true }));

vi.mock("@capacitor/core", () => ({
  registerPlugin: () => plugin,
  Capacitor: {
    isNativePlatform: () => platform.native,
    isPluginAvailable: () => platform.available,
  },
}));

import { REST_NOTIFICATION_ID, restAlertTime, syncRestNotification } from "./rest-notification";

const NOW = Date.parse("2026-11-11T20:00:00.000Z");
const rest = (secondsFromNow: number) => ({
  endsAt: new Date(NOW + secondsFromNow * 1000).toISOString(),
  durationSec: 90,
});

describe("restAlertTime", () => {
  it("rings at the rest's end time", () => {
    expect(restAlertTime(rest(90), NOW)?.toISOString()).toBe("2026-11-11T20:01:30.000Z");
  });

  it("has nothing to ring for with no rest, an ended rest or a bad time", () => {
    expect(restAlertTime(undefined, NOW)).toBeNull();
    expect(restAlertTime(rest(-5), NOW)).toBeNull();
    expect(restAlertTime(rest(0.5), NOW)).toBeNull();
    expect(restAlertTime({ endsAt: "soon", durationSec: 90 }, NOW)).toBeNull();
  });
});

describe("syncRestNotification", () => {
  beforeEach(() => {
    platform.native = true;
    platform.available = true;
    plugin.cancel.mockClear();
    plugin.schedule.mockClear();
  });

  it("replaces the scheduled notification with one for the new end time", async () => {
    await syncRestNotification(rest(105), NOW);
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: [{ id: REST_NOTIFICATION_ID }] });
    expect(plugin.schedule).toHaveBeenCalledTimes(1);
    const [notification] = plugin.schedule.mock.calls[0]![0].notifications;
    expect(notification.id).toBe(REST_NOTIFICATION_ID);
    expect(notification.schedule.at.toISOString()).toBe("2026-11-11T20:01:45.000Z");
    expect(notification.title).toBe("Rest over");
  });

  it("only cancels when the rest is skipped or the workout ends", async () => {
    await syncRestNotification(undefined, NOW);
    expect(plugin.cancel).toHaveBeenCalledTimes(1);
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it("does nothing on the website", async () => {
    platform.native = false;
    await syncRestNotification(rest(90), NOW);
    expect(plugin.cancel).not.toHaveBeenCalled();
    expect(plugin.schedule).not.toHaveBeenCalled();
  });

  it("never throws when the user refuses notifications", async () => {
    plugin.schedule.mockReturnValueOnce(Promise.reject(new Error("denied")));
    await expect(syncRestNotification(rest(90), NOW)).resolves.toBeUndefined();
  });
});
