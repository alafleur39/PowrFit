// Firebase App Check (Phase 8): proves requests to Firestore come from the
// real PowrFit website, using reCAPTCHA v3. Pure, so when it runs is tested.
// Website only for now: reCAPTCHA can't verify the iOS app's capacitor://
// page, which gets App Attest later. Off in browser tests (emulators) and
// without a site key. Firestore isn't enforcing yet (monitor mode), so a
// missing or failed token never blocks anyone.

export type AppCheckEnv = {
  siteKey: string | undefined;
  /** Running inside the iOS app (Capacitor). */
  native: boolean;
  emulators: boolean;
  /** Running in a browser, not during the server render or build. */
  browser: boolean;
};

export function appCheckSiteKey(env: AppCheckEnv): string | null {
  if (!env.siteKey || env.native || env.emulators || !env.browser) return null;
  return env.siteKey;
}
