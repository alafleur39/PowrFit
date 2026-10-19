"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shell/placeholder";
import { workoutTotals } from "@/lib/strength";
import { formatDate, formatWeight } from "@/lib/workout/format";
import { useActiveWorkout } from "./active-workout-provider";
import { FailedSaveActions } from "./failed-save-actions";
import { PrBadge } from "./pr-badge";
import { SyncBadge } from "./sync-badge";
import { useRecords } from "./use-records";
import { useRecentWorkouts } from "./use-workout-logs";

const PAGE = 20;

// Workout history (P2-11): bounded pages of 20, newest first, with failed
// saves on top so they're noticed. Totals use workoutTotals in the user's
// unit, matching the summary and Home.
export function HistoryList() {
  const [count, setCount] = useState(PAGE);
  const { unit } = useActiveWorkout();
  const { items, loading, error } = useRecentWorkouts(count);
  const { records } = useRecords();

  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={error ? "Couldn't load your history" : "No workouts yet"}
        hint={
          error
            ? "Check your connection and try again."
            : "Finished workouts will appear here."
        }
      />
    );
  }

  const serverCount = items.filter((item) => item.status !== "failed").length;

  return (
    <div className="flex flex-col gap-2 px-4 py-4 sm:px-6">
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          if (!("log" in item)) {
            return (
              <li key={item.id} className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted-foreground">
                {item.problem === "unsupported"
                  ? "Saved by a newer app version. Update PowrFit to view it."
                  : "This workout's data couldn't be read."}
              </li>
            );
          }
          const totals = workoutTotals(item.log.exercises, unit);
          const prs = records.get(item.id)?.length ?? 0;
          return (
            <li key={item.id} className="rounded-2xl border border-border bg-surface">
              <Link
                href={`/workouts/history/${item.id}`}
                className="flex items-center gap-3 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{formatDate(item.log.endedAt)}</p>
                  <p className="truncate font-bold">{item.log.routineName ?? "Workout"}</p>
                  <p className="text-sm text-muted-foreground">
                    {totals.sets} sets · <span className="font-mono tabular-nums">{formatWeight(totals.volume, unit)}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <SyncBadge status={item.status} />
                    {prs > 0 && <PrBadge label={`${prs} ${prs === 1 ? "PR" : "PRs"}`} />}
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
              </Link>
              {item.status === "failed" && (
                <div className="border-t border-border p-4">
                  <FailedSaveActions log={item.log} errorCode={item.errorCode} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {serverCount >= count && (
        <Button
          variant="outline"
          className="mt-2 h-11 border-border bg-transparent text-foreground hover:bg-surface hover:text-foreground"
          onClick={() => setCount((current) => current + PAGE)}
        >
          Load more
        </Button>
      )}
    </div>
  );
}
