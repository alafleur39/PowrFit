import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge has to know the theme's own type and radius names
// (globals.css). Otherwise it reads `text-caption` as a color and drops it,
// or drops `text-accent-foreground` for it, when both are in one cn() call.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["caption", "footnote", "body", "headline", "title3", "title2", "title1", "display"],
      radius: ["input", "tile", "card"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
