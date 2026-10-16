import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Firestore rules tests. They need the emulator, so run them through
// `npm run test:rules`, which starts it with `firebase emulators:exec`.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/rules/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
