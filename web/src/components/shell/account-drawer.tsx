"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, X } from "lucide-react";

import type { WeightUnit } from "@/lib/strength";
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "@/components/profile/profile-avatar";

type AccountDrawerProps = {
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
  accountName: string;
  accountEmail: string;
  unit: WeightUnit;
  onUnitChange: (unit: WeightUnit) => void;
};

// Slide-out account drawer (POWRFIT_NAV_SPEC §5/§7). Opened by the avatar
// (mobile top bar) or the sidebar account chip. Focus-trapped, closes on Esc
// and backdrop click, and restores focus to the trigger on close.
export function AccountDrawer({
  open,
  onClose,
  onSignOut,
  accountName,
  accountEmail,
  unit,
  onUnitChange,
}: AccountDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const focusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    focusable()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button
            type="button"
            aria-label="Close account menu"
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Account"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col border-r border-border bg-surface p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <ProfileAvatar className="size-11 text-base" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {accountName}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {accountEmail}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-surface-active hover:text-foreground"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <section aria-labelledby="unit-label" className="mt-6">
              <h2 id="unit-label" className="px-1 text-sm font-semibold text-foreground">
                Weight unit
              </h2>
              <p className="px-1 text-xs text-muted-foreground">
                Used for new sets and every total. Sets keep the unit they were entered in.
              </p>
              <div role="radiogroup" aria-labelledby="unit-label" className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-background p-1">
                {(["lb", "kg"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={unit === option}
                    onClick={() => onUnitChange(option)}
                    className={cn(
                      "h-11 rounded-lg text-sm font-bold transition-colors",
                      unit === option
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </section>

            <button
              type="button"
              onClick={onSignOut}
              className="mt-auto flex h-12 items-center gap-3 rounded-xl px-3 text-left font-medium text-foreground transition-colors hover:bg-surface-active"
            >
              <LogOut className="size-5 text-muted-foreground" aria-hidden />
              Sign out
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
