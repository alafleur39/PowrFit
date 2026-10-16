import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next ignores the Expo app's lockfile one level up.
  turbopack: {
    root: __dirname,
  },
  // Browsers must always re-check the service worker so a new deploy takes
  // over after one reload (Next PWA guide; P1-09). Mirrored in netlify.toml.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
