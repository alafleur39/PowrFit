"use client";

// Install state for this device (P4-07, D26). Chrome and Edge fire
// beforeinstallprompt once, possibly before Home is on screen, so the event
// is caught from app start (ServiceWorkerRegistration) and kept here.
// Components read it with useInstallState; on the server the card is hidden.

import { useSyncExternalStore } from "react";

import { INSTALL_DISMISSED_KEY, isIosDevice } from "@/lib/install";

/** Chromium's install prompt event (not in TypeScript's DOM types). */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallState = {
  canPrompt: boolean;
  standalone: boolean;
  dismissed: boolean;
  ios: boolean;
};

const SERVER_STATE: InstallState = { canPrompt: false, standalone: true, dismissed: true, ios: false };

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
/** "Not now" when storage is blocked: remembered until the page reloads. */
let dismissedHere = false;
let started = false;
let state: InstallState = SERVER_STATE;
const listeners = new Set<() => void>();

function readDismissed(): boolean {
  if (dismissedHere) return true;
  try {
    return window.localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return installed || iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

/** Rebuilds the snapshot (a new object only when something changed) and notifies. */
function refresh() {
  const next: InstallState = {
    canPrompt: deferred !== null,
    standalone: isStandalone(),
    dismissed: readDismissed(),
    ios: isIosDevice(navigator.userAgent, navigator.maxTouchPoints),
  };
  const same = (Object.keys(next) as (keyof InstallState)[]).every((key) => next[key] === state[key]);
  if (same) return;
  state = next;
  for (const listener of listeners) listener();
}

/** Starts listening for the browser's install events. Safe to call twice. */
export function startInstallListener(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    // Keep the browser's mini-infobar away; Home offers the prompt instead.
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    refresh();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    refresh();
  });
  refresh();
}

function subscribe(listener: () => void) {
  startInstallListener();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE
  );
}

/** Shows the browser's install prompt. The event can only be used once. */
export async function promptInstall(): Promise<void> {
  const event = deferred;
  if (!event) return;
  deferred = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  if (outcome === "accepted") installed = true;
  refresh();
}

/** "Not now": hides the card on this device. */
export function dismissInstall(): void {
  dismissedHere = true;
  try {
    window.localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
  } catch {
    // Storage blocked: dismissedHere hides it until the page reloads.
  }
  refresh();
}
