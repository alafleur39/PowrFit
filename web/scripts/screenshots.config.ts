import { defineConfig } from "@playwright/test";

import base from "../playwright.config";

// The playbook's screenshot loop (scripts/screenshots.spec.ts): the e2e
// setup, iPhone 13 only.
export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: "screenshots.spec.ts",
  projects: base.projects?.filter((project) => project.name === "iphone-13"),
});
