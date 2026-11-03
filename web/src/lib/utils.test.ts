import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("keeps a token text size next to a text color", () => {
    expect(cn("text-caption", "text-accent")).toBe("text-caption text-accent");
    expect(cn("text-accent-foreground", "text-headline")).toBe("text-accent-foreground text-headline");
  });

  it("still lets a later size or radius win", () => {
    expect(cn("text-footnote", "text-title2")).toBe("text-title2");
    expect(cn("rounded-input", "rounded-card")).toBe("rounded-card");
  });
});
