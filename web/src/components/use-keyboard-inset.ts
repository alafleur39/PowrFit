"use client";

import { useEffect, useState } from "react";

// How far the on-screen keyboard covers the bottom of the page, in CSS px
// (UI playbook Phase 5: the keyboard never covers an input). iOS doesn't
// shrink the page for the keyboard, so a `fixed bottom-0` bar ends up
// behind it; the visual viewport is what's still visible. 0 when there's no
// keyboard, on desktop, and before the first measurement.
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const measure = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      // Ignore the small jiggle of Safari's toolbar collapsing.
      setInset(covered > 80 ? Math.round(covered) : 0);
    };
    measure();
    viewport.addEventListener("resize", measure);
    viewport.addEventListener("scroll", measure);
    return () => {
      viewport.removeEventListener("resize", measure);
      viewport.removeEventListener("scroll", measure);
    };
  }, []);

  return inset;
}
