import { describe, expect, it } from "vitest";

import { sentrySettings } from "./sentry-options";

const base = { dsn: "https://key@o1.ingest.us.sentry.io/1", native: false, production: true, emulators: false, release: "abc123" };

describe("Sentry settings", () => {
  it("samples 10% of traces in production and all of them locally", () => {
    expect(sentrySettings(base).tracesSampleRate).toBe(0.1);
    expect(sentrySettings({ ...base, production: false }).tracesSampleRate).toBe(1);
  });

  it("names the environment by build and platform", () => {
    expect(sentrySettings(base).environment).toBe("production-web");
    expect(sentrySettings({ ...base, native: true }).environment).toBe("production-ios");
    expect(sentrySettings({ ...base, production: false }).environment).toBe("development-web");
  });

  it("stays off in browser tests and without a DSN, and never sends personal data", () => {
    expect(sentrySettings(base).enabled).toBe(true);
    expect(sentrySettings({ ...base, emulators: true }).enabled).toBe(false);
    expect(sentrySettings({ ...base, dsn: undefined }).enabled).toBe(false);
    expect(sentrySettings(base).sendDefaultPii).toBe(false);
  });
});
