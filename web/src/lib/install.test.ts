import { describe, expect, it } from "vitest";

import { installCardKind, isIosDevice } from "./install";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

describe("isIosDevice", () => {
  it("spots iPhones and iPads that report as a Mac", () => {
    expect(isIosDevice(IPHONE, 5)).toBe(true);
    expect(isIosDevice(MAC, 5)).toBe(true);
    expect(isIosDevice(MAC, 0)).toBe(false);
    expect(isIosDevice(ANDROID, 5)).toBe(false);
  });
});

describe("installCardKind", () => {
  const base = { finishedWorkouts: 2, standalone: false, dismissed: false, ios: false, canPrompt: true };

  it("waits for the 2nd finished workout", () => {
    expect(installCardKind({ ...base, finishedWorkouts: 1 })).toBeNull();
    expect(installCardKind(base)).toBe("prompt");
  });

  it("hides once installed or dismissed", () => {
    expect(installCardKind({ ...base, standalone: true })).toBeNull();
    expect(installCardKind({ ...base, dismissed: true })).toBeNull();
  });

  it("explains Share on iOS and stays hidden where installing isn't offered", () => {
    expect(installCardKind({ ...base, canPrompt: false, ios: true })).toBe("ios");
    expect(installCardKind({ ...base, canPrompt: false })).toBeNull();
  });
});
