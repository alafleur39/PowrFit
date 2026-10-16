"use client";

import { Plus } from "lucide-react";

// Mobile floating "Log workout" action (POWRFIT_NAV_SPEC §5). Yellow surface
// with a near-black icon; sits above the bottom tab bar. Hidden at md, where
// the Sidebar's full-width CTA fires the same action.
export function Fab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Log workout"
      className="brand-glow fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 flex size-14 items-center justify-center rounded-full bg-accent text-background shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
    >
      <Plus className="size-7" aria-hidden />
    </button>
  );
}
