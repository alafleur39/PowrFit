import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for pure logic only (node environment). jsdom + Testing Library
// get added with the first component test — see the Phase 1 plan.
export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path in tsconfig.json. Declared here rather than via
    // tsconfig resolution, which also picks up the Expo app's tsconfig one
    // directory up and fails on its missing "expo/tsconfig.base".
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
