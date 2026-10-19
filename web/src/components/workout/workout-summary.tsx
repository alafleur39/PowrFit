"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useActiveWorkout } from "./active-workout-provider";
import { FailedSaveActions } from "./failed-save-actions";
import { SaveAsRoutine } from "./save-as-routine";
import { SyncBadge } from "./sync-badge";
import { useWorkout } from "./use-workout-logs";
import { workoutTotals } from "@/lib/strength";
import { formatDate, formatDuration, formatSetsLine, formatWeight } from "@/lib/workout/format";

// Workout summary (design spec §6.6). Totals are recomputed with
// workoutTotals in the user's unit, the same way Home and History do it.
// Reads from the Firestore cache and this device's receipts, so it renders
// offline: the logger shows it in place right after Finish.
export function WorkoutSummary({ logId, top }: { logId: string; top?: ReactNode }) {
  const { unit } = useActiveWorkout();
  const { item, loading, error } = useWorkout(logId);

  const back = top ?? (
    <Link
      href="/workouts?tab=history"
      className="inline-flex h-11 items-center gap-2 px-4 text-sm font-medium text-muted-foreground hover:text-foreground sm:px-6"
    >
      <ArrowLeft className="size-4" aria-hidden />
      History
    </Link>
  );

  if (!item) {
    return (
      <div>
        {back}
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
          {loading ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {error
                ? "Couldn't load this workout. Check your connection and try again."
                : "This workout isn't available on this device."}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!("log" in item)) {
    return (
      <div>
        {back}
        <p className="px-4 py-16 text-center text-sm text-muted-foreground sm:px-6">
          {item.problem === "unsupported"
            ? "This workout was saved by a newer version of PowrFit. Update the app to view it."
            : "This workout's data couldn't be read."}
        </p>
      </div>
    );
  }

  const { log } = item;
  const totals = workoutTotals(log.exercises, unit);

  return (
    <div className="pb-10">
      {back}
      <header className="px-4 pb-4 sm:px-6">
        <p className="text-sm text-muted-foreground">{formatDate(log.endedAt)}</p>
        <h1 className="mt-1 text-2xl font-bold">{log.routineName ?? "Workout"}</h1>
        <SyncBadge status={item.status} className="mt-2" />
      </header>

      {item.status === "failed" && (
        <div className="mx-4 mb-4 rounded-2xl border border-danger/40 bg-surface p-4 sm:mx-6">
          <FailedSaveActions log={log} errorCode={item.errorCode} />
        </div>
      )}

      <dl className="mx-4 grid grid-cols-2 gap-3 sm:mx-6 sm:grid-cols-4">
        {[
          ["Duration", formatDuration(log.startedAt, log.endedAt)],
          ["Volume", formatWeight(totals.volume, unit)],
          ["Sets", String(totals.sets)],
          ["Reps", String(totals.reps)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-mono text-lg font-bold tabular-nums text-accent">{value}</dd>
          </div>
        ))}
      </dl>

      <SaveAsRoutine log={log} />

      <ol className="mx-4 mt-4 flex flex-col gap-3 sm:mx-6">
        {log.exercises.map((exercise, index) => (
          <li key={`${exercise.exerciseId}-${index}`} className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="font-bold">{exercise.exerciseName}</h2>
            <p className="text-xs text-muted-foreground">{unit} × reps</p>
            <ol className="mt-2 flex flex-col gap-1 text-sm">
              {exercise.sets.map((set, setIndex) => (
                <li key={setIndex} className="flex gap-3">
                  <span className="w-5 text-muted-foreground">{setIndex + 1}</span>
                  <span className="font-mono tabular-nums">{formatSetsLine([set], unit)}</span>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}
