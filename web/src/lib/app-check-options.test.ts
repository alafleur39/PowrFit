import { describe, expect, it } from "vitest";

import { appCheckSiteKey } from "./app-check-options";

const base = { siteKey: "6Lsite", native: false, emulators: false, browser: true };

describe("App Check", () => {
  it("runs on the website with a site key", () => {
    expect(appCheckSiteKey(base)).toBe("6Lsite");
  });

  it("stays off in the iOS app, browser tests, the server render and without a key", () => {
    expect(appCheckSiteKey({ ...base, native: true })).toBeNull();
    expect(appCheckSiteKey({ ...base, emulators: true })).toBeNull();
    expect(appCheckSiteKey({ ...base, browser: false })).toBeNull();
    expect(appCheckSiteKey({ ...base, siteKey: undefined })).toBeNull();
    expect(appCheckSiteKey({ ...base, siteKey: "" })).toBeNull();
  });
});
