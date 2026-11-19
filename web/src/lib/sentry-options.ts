// Sentry's settings (Phase 8, crash reporting). Pure, so the choices are
// tested: errors everywhere, tracing sampled fully locally and at 10% in
// production, warnings and errors from the console as logs. Off in browser
// tests (Firebase emulators) and when no DSN is set, so tests never send.
// No personal data: Sentry gets the Firebase user id, never the email.

export type SentryEnv = {
  dsn: string | undefined;
  /** Running inside the iOS app (Capacitor). */
  native: boolean;
  production: boolean;
  emulators: boolean;
  release: string | undefined;
};

export function sentrySettings(env: SentryEnv) {
  return {
    dsn: env.dsn,
    enabled: Boolean(env.dsn) && !env.emulators,
    environment: `${env.production ? "production" : "development"}-${env.native ? "ios" : "web"}`,
    ...(env.release && { release: env.release }),
    sendDefaultPii: false,
    tracesSampleRate: env.production ? 0.1 : 1.0,
    enableLogs: true,
  };
}
