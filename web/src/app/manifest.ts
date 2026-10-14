import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PowrFit",
    short_name: "PowrFit",
    description: "Mobile-first training, workout logging, and progress tracking.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#111827",
    icons: [
      {
        src: "/powrfit-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
