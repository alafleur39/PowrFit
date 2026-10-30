import type { NextConfig } from "next";

const DEV = process.env.NODE_ENV !== "production";
const EMULATORS = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

// Content Security Policy for every page. The browser only talks to this
// site and to Firebase Auth and Firestore; the gyms map lookups happen on the
// server, and Unsplash photos come through /_next/image. Next needs inline
// scripts to start the page (and eval in dev). Pages can't be framed.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${DEV ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  [
    "connect-src 'self'",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://firestore.googleapis.com",
    ...(EMULATORS ? ["http://127.0.0.1:9099", "http://127.0.0.1:8080"] : []),
    ...(DEV ? ["ws://localhost:*"] : []),
  ].join(" "),
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(DEV || EMULATORS ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Near me asks for location; nothing else needs device access.
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=()" },
];

// `npm run build:ios` (P7-01, D43): a static export into out/ for the iOS
// app to bundle. It has no server, so it leaves out the website-only
// .web.ts(x) files (the gyms endpoint, old-address redirects), serves images
// as-is, and can't send headers.
const STATIC_EXPORT = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next ignores the Expo app's lockfile one level up.
  turbopack: {
    root: __dirname,
  },
  // Trailing slashes make each page a folder with an index.html, which plain
  // file servers (and the iOS app's) serve without any rewrite rules.
  ...(STATIC_EXPORT ? { output: "export" as const, trailingSlash: true } : {}),
  pageExtensions: STATIC_EXPORT ? ["tsx", "ts"] : ["web.tsx", "web.ts", "tsx", "ts"],
  // The login page's hero photo is served from Unsplash.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }],
    unoptimized: STATIC_EXPORT,
  },
  headers: STATIC_EXPORT ? undefined : async () => [
    { source: "/:path*", headers: SECURITY_HEADERS },
    // Browsers must always re-check the service worker so a new deploy takes
    // over after one reload (Next PWA guide; P1-09). Mirrored in netlify.toml.
    // Listed last so its stricter CSP replaces the one above.
    {
      source: "/sw.js",
      headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
      ],
    },
  ],
};

export default nextConfig;
