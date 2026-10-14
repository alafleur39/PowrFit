"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

export type SegmentedTab = {
  id: string;
  label: string;
  content: ReactNode;
};

// Segmented top tabs with a yellow underline that slides between tabs via a
// shared `layoutId`, plus a fade/slide on content change (POWRFIT_NAV_SPEC §3/§6).
// Clickable + animated now; touch-swipe is deferred per §6.
export function SegmentedTabs({
  tabs,
  ariaLabel,
}: {
  tabs: SegmentedTab[];
  ariaLabel: string;
}) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const baseId = useId();
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex border-b border-border"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active?.id;
          return (
            <button
              key={tab.id}
              id={`${baseId}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              onClick={() => setActiveId(tab.id)}
              className={cn(
                "relative flex-1 px-4 py-3.5 text-sm font-semibold transition-colors sm:flex-none sm:px-6",
                selected
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {selected && (
                <motion.span
                  layoutId={`${baseId}-underline`}
                  className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 420, damping: 38 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active?.id}
          id={`${baseId}-panel-${active?.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${active?.id}`}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.18 }}
        >
          {active?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
