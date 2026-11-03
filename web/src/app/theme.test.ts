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

// opengraph-image draws a PNG on the server with inline styles; it can't use classes.
const sourceFiles = tsxFiles(srcDir)
  .filter((file) => !file.endsWith(".test.tsx") && !file.endsWith("opengraph-image.tsx"))
  .map((file) => ({ file: file.slice(srcDir.length), text: readFileSync(file, "utf8") }));
const source = sourceFiles.map(({ text }) => text).join("\n");

const COLOR_NAMES = [
  "surface",
  "surface-raised",
  "accent",
  "accent-muted",
  "tertiary-foreground",
  "success",
  "warning",
  "danger",
  "danger-foreground",
  "scrim",
];

describe("theme tokens", () => {
  it.each(COLOR_NAMES)("defines --color-%s when a component uses it", (name) => {
    const used = new RegExp(`\\b(bg|text|border|ring|fill|stroke)-${name}\\b`).test(source);
    if (used) expect(css).toContain(`--color-${name}:`);
  });

  it("is dark-only with the yellow brand accent", () => {
    expect(css).toContain("color-scheme: dark");
    expect(css).toMatch(/--brand:\s*#ffd60a/i);
    expect(css).toMatch(/--accent:\s*var\(--brand\)/);
  });
});

// UI playbook Phase 1: screens use tokens only (docs/design/DESIGN_RULES.md).
describe("components use tokens only", () => {
  const banned: [string, RegExp][] = [
    ["raw colors", /#[0-9a-f]{3,8}\b|rgba?\(|\b(?:text|bg|border|fill|stroke)-(?:white|black)\b/i],
    ["pixel or arbitrary font sizes", /\btext-\[\d/],
    ["Tailwind's default type scale (use caption … display)", /(?<![\w-])text-(?:xs|sm|base|lg|[2-9]?xl)(?![\w-])/],
    ["radii outside input/tile/card/full", /(?<![\w-])rounded(?:-[trbl]{1,2})?-(?:sm|md|lg|x?l|[2-9]xl|\[)/],
    ["a monospace font", /\bfont-mono\b/],
    ["glows, shadows or blur", /\bshadow-(?:xs|sm|md|lg|xl|2xl|\[)|backdrop-blur|brand-glow/],
  ];
  // The <meta name="theme-color"> value has to be a literal.
  const allowed = (file: string, line: string) => file.endsWith("app/layout.tsx") && line.includes("themeColor");

  it.each(banned)("no %s", (_label, pattern) => {
    const hits = sourceFiles.flatMap(({ file, text }) =>
      text
        .split("\n")
        .flatMap((line, i) => (pattern.test(line) && !allowed(file, line) ? [`${file}:${i + 1}: ${line.trim()}`] : []))
    );
    expect(hits).toEqual([]);
  });
});
