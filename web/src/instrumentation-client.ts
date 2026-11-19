// Runs before the app becomes interactive, on the website and in the iOS
// app's bundle (Next's instrumentation-client convention). Starts Sentry
// (Phase 8): the Capacitor SDK also catches native iOS crashes and passes
// web errors to the React SDK, which it requires at the same version.

import { Capacitor } from "@capacitor/core";
import * as Sentry from "@sentry/capacitor";
import * as SentryReact from "@sentry/react";

import { sentrySettings } from "@/lib/sentry-options";

try {
  Sentry.init(
    {
      ...sentrySettings({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        native: Capacitor.isNativePlatform(),
        production: process.env.NODE_ENV === "production",
        emulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true",
        release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
      }),
      integrations: [
        Sentry.browserTracingIntegration(),
        SentryReact.consoleLoggingIntegration({ levels: ["warn", "error"] }),
      ],
    },
    SentryReact.init
  );
} catch (error) {
  // Monitoring must never stop the app from starting.
  console.warn("Sentry didn't start", error);
}
