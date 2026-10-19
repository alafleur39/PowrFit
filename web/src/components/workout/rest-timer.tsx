"use client";

import { useEffect, useRef } from "react";
import { Timer } from "lucide-react";

import { adjustRest, skipRest, type DraftRest } from "@/lib/strength";
import { useActiveWorkout } from "./active-workout-provider";
import { useNow } from "./use-now";

/** Whole seconds left, never negative. */
export function restRemaining(rest: DraftRest, nowMs: number): number {
  return Math.max(0, Math.ceil((Date.parse(rest.endsAt) - nowMs) / 1000));
}

export function formatRest(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const control =
  "flex h-11 min-w-11 items-center justify-center rounded-full border border-border px-3 text-sm font-semibold text-foreground hover:bg-surface-raised";

// Rest timer (P4-04, D23). Runs from the end time saved in the draft, so it
// keeps counting through a reload or a locked phone. In-app only: iOS
// limits notifications from home-screen apps. Vibrates once at the end
// where the device allows it.
export function RestTimer({ rest }: { rest: DraftRest }) {
  const { update } = useActiveWorkout();
  const now = useNow(250);
  const remaining = restRemaining(rest, now);
  const over = remaining === 0;
  const buzzed = useRef<string | null>(null);

  useEffect(() => {
    if (!over || buzzed.current === rest.endsAt) return;
    buzzed.current = rest.endsAt;
    // Only buzz for a rest that just ended, not one that ended long ago.
    if (now - Date.parse(rest.endsAt) < 5000) navigator.vibrate?.(200);
  }, [over, rest.endsAt, now]);

  const progress = over ? 1 : 1 - remaining / rest.durationSec;

  return (
    <div
      role="region"
      aria-label="Rest timer"
      className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-accent/40 bg-surface-active px-4 py-3 md:inset-x-auto md:bottom-6 md:left-1/2 md:w-[min(560px,calc(100vw-3rem))] md:-translate-x-1/2 md:rounded-2xl md:border"
    >
      <div className="flex items-center gap-3">
        <Timer className="size-5 shrink-0 text-accent" aria-hidden />
        <p className="min-w-0 flex-1" role="status">
          {over ? (
            <span className="font-bold text-accent">Rest over. Next set!</span>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">Rest </span>
              <span className="font-mono text-xl font-bold tabular-nums text-accent">
                {formatRest(remaining)}
              </span>
            </>
          )}
        </p>
        {!over && (
          <>
            <button
              type="button"
              aria-label="Take 15 seconds off the rest"
              onClick={() => update((draft, time) => adjustRest(draft, -15, time))}
              className={control}
            >
              −15
            </button>
            <button
              type="button"
              aria-label="Add 15 seconds of rest"
              onClick={() => update((draft, time) => adjustRest(draft, 15, time))}
              className={control}
            >
              +15
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => update((draft, time) => skipRest(draft, time))}
          className={`${control} border-accent/60 text-accent`}
        >
          {over ? "Dismiss" : "Skip"}
        </button>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-border" aria-hidden>
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
