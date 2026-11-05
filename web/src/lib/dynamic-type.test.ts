import { describe, expect, it } from "vitest";

import { DYNAMIC_TYPE_SCRIPT } from "./dynamic-type";

// Runs the inline script against a stand-in browser: `bodyPx` is what WebKit
// reports for font: -apple-system-body.
function run({ userAgent, bodyPx, platform = "iPhone" }: { userAgent: string; bodyPx: number; platform?: string }) {
  const set = new Map<string, string>();
  const listeners: (() => void)[] = [];
  const root = {
    style: { setProperty: (name: string, value: string) => set.set(name, value) },
    appendChild: () => {},
    removeChild: () => {},
  };
  const document = {
    documentElement: root,
    hidden: false,
    createElement: () => ({ style: {} }),
    addEventListener: (_: string, listener: () => void) => listeners.push(listener),
  };
  const navigator = { userAgent, platform, maxTouchPoints: 5 };
  const getComputedStyle = () => ({ fontSize: `${bodyPx}px` });
  new Function("document", "navigator", "getComputedStyle", DYNAMIC_TYPE_SCRIPT)(document, navigator, getComputedStyle);
  return { scale: set.get("--type-scale"), listeners };
}

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15";

describe("Dynamic Type script", () => {
  it("is 1 at the default iPhone text size", () => {
    expect(run({ userAgent: IPHONE, bodyPx: 17 }).scale).toBe("1");
  });

  it("grows with larger text and stops at the largest accessibility size", () => {
    expect(run({ userAgent: IPHONE, bodyPx: 23 }).scale).toBe("1.35");
    expect(run({ userAgent: IPHONE, bodyPx: 53 }).scale).toBe("3.1");
    expect(run({ userAgent: IPHONE, bodyPx: 80 }).scale).toBe("3.1");
  });

  it("shrinks for the smaller iPhone sizes", () => {
    expect(run({ userAgent: IPHONE, bodyPx: 14 }).scale).toBe("0.82");
  });

  it("leaves Macs and other computers alone", () => {
    expect(run({ userAgent: MAC, platform: "MacIntel", bodyPx: 13 }).scale).toBeUndefined();
    expect(run({ userAgent: "Mozilla/5.0 (Windows NT 10.0)", platform: "Win32", bodyPx: 17 }).scale).toBeUndefined();
  });

  it("ignores Mac-sized readings even with an iPhone user agent", () => {
    expect(run({ userAgent: IPHONE, bodyPx: 13 }).scale).toBeUndefined();
  });

  it("measures again when the app comes back to the front", () => {
    const { listeners } = run({ userAgent: IPHONE, bodyPx: 17 });
    expect(listeners).toHaveLength(1);
  });
});
