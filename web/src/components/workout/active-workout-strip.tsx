"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell } from "lucide-react";

import { formatElapsed } from "@/lib/workout/format";
import { useActiveWorkout } from "./active-workout-provider";
import { useNow } from "./use-now";

// "Workout in progress · 12:34" (design spec §5). Sits above the bottom tab
// bar on phones so History stays reachable mid-workout; hidden on /log.
export function ActiveWorkoutStrip() {
  const { draft } = useActiveWorkout();
  const pathname = usePathname();
  const now = useNow();

  if (!draft || pathname === "/log") return null;

  return (
    <Link
      href="/log"
      className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 border-t border-accent/40 bg-surface-active px-4 py-3 text-sm md:inset-x-auto md:bottom-6 md:left-1/2 md:w-[min(560px,calc(100vw-3rem))] md:-translate-x-1/2 md:rounded-full md:border"
    >
      <span className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
        <Dumbbell className="size-4 shrink-0 text-accent" aria-hidden />
        <span className="truncate">
          {draft.routineName ?? "Workout"} in progress
        </span>
      </span>
      <span className="font-mono tabular-nums text-accent">
        {formatElapsed(draft.startedAt, now)}
      </span>
    </Link>
  );
}
