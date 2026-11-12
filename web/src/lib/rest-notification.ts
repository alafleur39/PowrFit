import { Capacitor, registerPlugin } from "@capacitor/core";
import type { LocalNotificationsPlugin } from "@capacitor/local-notifications";

import type { DraftRest } from "@/lib/strength";

// Rest timer on a locked phone (P7-03). In the iOS app, the end of a rest is
// also a local notification scheduled for the rest's end time, so it rings
// while the phone is locked or another app is open. There is only ever one
// rest, so one fixed id: every change cancels it and schedules it again.
// While the app is open the in-app timer and a haptic do the job, and
// capacitor.config.ts hides notifications in the foreground. Websites keep
// the in-app timer only.

export const REST_NOTIFICATION_ID = 1;

/** Rests ending sooner than this aren't worth a notification. */
const MIN_LEAD_MS = 1000;

const LocalNotifications = registerPlugin<LocalNotificationsPlugin>("LocalNotifications");

/** When to ring for this rest, or null to only cancel. */
export function restAlertTime(rest: DraftRest | undefined, nowMs: number): Date | null {
  if (!rest) return null;
  const endsAt = Date.parse(rest.endsAt);
  if (Number.isNaN(endsAt) || endsAt - nowMs < MIN_LEAD_MS) return null;
  return new Date(endsAt);
}

function available(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("LocalNotifications");
}

// Quick taps on +15s send several changes at once; running them in order
// makes sure the last one wins.
let queue: Promise<void> = Promise.resolve();

/**
 * Makes the scheduled notification match the current rest. iOS asks for
 * permission the first time a rest starts; if the user says no, the in-app
 * timer still works.
 */
export function syncRestNotification(
  rest: DraftRest | undefined,
  nowMs: number = Date.now()
): Promise<void> {
  if (!available()) return Promise.resolve();
  queue = queue.then(() => applyRest(rest, nowMs));
  return queue;
}

async function applyRest(rest: DraftRest | undefined, nowMs: number): Promise<void> {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REST_NOTIFICATION_ID }] });
    const at = restAlertTime(rest, nowMs);
    if (!at) return;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REST_NOTIFICATION_ID,
          title: "Rest over",
          body: "Time for your next set.",
          // iOS plays its default sound for a name it can't find.
          sound: "default",
          schedule: { at, allowWhileIdle: true },
        },
      ],
    });
  } catch {
    // A notification is a nicety: a refusal or failure must never break the workout.
  }
}
