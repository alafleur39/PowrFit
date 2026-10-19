// When Home suggests installing PowrFit (Phase 4, P4-07, decision D26).
// Pure, so the rules can be tested without a browser.

/** The card appears once this many workouts are finished (D14). */
export const INSTALL_AFTER_WORKOUTS = 2;

/** localStorage key for "Not now". Per device, not per account. */
export const INSTALL_DISMISSED_KEY = "powrfit:install-dismissed";

/**
 * iPhone and iPad have no install prompt; Safari's Share menu adds the app.
 * iPadOS reports itself as a Mac, so a touch screen gives it away.
 */
export function isIosDevice(userAgent: string, maxTouchPoints: number): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}

export type InstallCardKind = "ios" | "prompt";

/**
 * "ios" explains Share → Add to Home Screen, "prompt" offers the browser's
 * own Install button, null shows nothing (too early, already installed,
 * dismissed, or a browser that can't install).
 */
export function installCardKind(options: {
  finishedWorkouts: number;
  standalone: boolean;
  dismissed: boolean;
  ios: boolean;
  canPrompt: boolean;
}): InstallCardKind | null {
  if (options.finishedWorkouts < INSTALL_AFTER_WORKOUTS) return null;
  if (options.standalone || options.dismissed) return null;
  if (options.canPrompt) return "prompt";
  return options.ios ? "ios" : null;
}
