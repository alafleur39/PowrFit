"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/react";

import "./globals.css";

// The last-resort screen when the app itself crashes (Phase 8). React
// catches the error here, so it would never reach Sentry on its own.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <h1 className="text-title2 font-bold">Something went wrong</h1>
        <p className="max-w-sm text-footnote text-muted-foreground">
          PowrFit hit a problem and has been told about it. Your workouts are safe.
        </p>
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-full bg-accent px-6 font-bold text-accent-foreground"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
