import type { MetadataRoute } from "next";

// Install metadata (P1-08). Colors match --bg (decision D11). Icons are
// rendered from public/icons/icon.svg; the bolt sits inside the maskable
// safe zone, so the maskable copy is the same artwork.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PowrFit",
    short_name: "PowrFit",
    description: "Mobile-first training, workout logging, and progress tracking.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
