import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next ignores the Expo app's lockfile one level up.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
