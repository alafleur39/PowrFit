import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Guards against the P2-01 defect: components used theme classes that were
// never defined, so Tailwind silently emitted nothing for them.

const srcDir = fileURLToPath(new URL("..", import.meta.url));
const css = readFileSync(fileURLToPath(new URL("./globals.css", import.meta.url)), "utf8");

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return tsxFiles(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

const source = tsxFiles(srcDir)
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

const COLOR_NAMES = ["surface", "surface-active", "surface-raised", "accent", "success", "danger"];
const UTILITIES = ["brand-glow", "glass-card", "energy-grid"];

describe("theme tokens", () => {
  it.each(COLOR_NAMES)("defines --color-%s when a component uses it", (name) => {
    const used = new RegExp(`\\b(bg|text|border|ring)-${name}\\b`).test(source);
    if (used) expect(css).toContain(`--color-${name}:`);
  });

  it.each(UTILITIES)("defines the %s utility when a component uses it", (name) => {
    if (source.includes(name)) expect(css).toContain(`@utility ${name}`);
  });

  it("is dark-only with the yellow brand accent", () => {
    expect(css).toContain("color-scheme: dark");
    expect(css).toMatch(/--brand:\s*#ffd60a/i);
    expect(css).toMatch(/--accent:\s*var\(--brand\)/);
  });
});
