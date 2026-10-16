import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import manifest from "./manifest";

const publicDir = fileURLToPath(new URL("../../public", import.meta.url));

describe("web app manifest", () => {
  const m = manifest();

  it("installs as a standalone app with a stable id", () => {
    expect(m.display).toBe("standalone");
    expect(m.id).toBe("/");
  });

  it("starts inside its scope", () => {
    expect(m.start_url?.startsWith(m.scope ?? "/")).toBe(true);
  });

  it("uses the dark background color (D11)", () => {
    expect(m.theme_color).toBe("#0A0A0A");
    expect(m.background_color).toBe("#0A0A0A");
  });

  it("has 192 and 512 PNG icons and a maskable icon", () => {
    const icons = m.icons ?? [];
    const png = (size: string, purpose: string) =>
      icons.some((icon) => icon.type === "image/png" && icon.sizes === size && icon.purpose === purpose);
    expect(png("192x192", "any")).toBe(true);
    expect(png("512x512", "any")).toBe(true);
    expect(png("512x512", "maskable")).toBe(true);
  });

  it("points every icon at a file that exists", () => {
    for (const icon of m.icons ?? []) {
      expect(existsSync(`${publicDir}${icon.src}`), icon.src).toBe(true);
    }
  });
});
