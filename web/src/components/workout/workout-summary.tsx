"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, Pencil, Trophy } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { StatGrid, StatTile } from "@/components/ui/stat-tile";
import { haptic } from "@/lib/haptics";
import { useActiveWorkout } from "./active-workout-provider";
import { FailedSaveActions } from "./failed-save-actions";
import { PrBadge } from "./pr-badge";
import { SaveAsRoutine } from "./save-as-routine";
import { SyncBadge } from "./sync-badge";
import { useRecords } from "./use-records";
import { useWorkout } from "./use-workout-logs";
import { WorkoutEditor } from "./workout-editor";
import { workoutTotals, type PersonalRecord, type WeightUnit } from "@/lib/strength";
import { formatCardioMinutes, formatDate, formatDuration, formatSetsLine, formatWeight } from "@/lib/workout/format";

// Workout summary (design spec §6.6). Totals are recomputed with
// workoutTotals in the user's unit, the same way Home and History do it.
// Reads from the Firestore cache and this device's receipts, so it renders
// offline: the logger shows it in place right after Finish.
/** `celebrate`: shown right after Finish, so new PRs get a success haptic. */
export function WorkoutSummary({ logId, top, celebrate = false }: { logId: string; top?: ReactNode; celebrate?: boolean }) {
  const { unit } = useActiveWorkout();
  const { item, loading, error } = useWorkout(logId);
  const { records } = useRecords();
  const [mode, setMode] = useState<"view" | "edit" | "deleted">("view");

  const back = top ?? (
    <Link
      href="/workouts?tab=history"
      className="inline-flex min-h-11 items-center gap-2 px-4 text-footnote font-medium text-muted-foreground hover:text-foreground sm:px-6"
    >
      <ChevronLeft className="size-5" aria-hidden />
      History
    </Link>
  );

  if (mode === "deleted") {
    return (
      <div>
        {back}
        <p role="status" className="px-4 py-16 text-center text-footnote text-muted-foreground sm:px-6">
          Workout deleted.
        </p>
      </div>
    );
  }

  if (!item) {
    return (
      <div>
        {back}
        {loading ? (
          <div aria-busy className="flex flex-col gap-4 px-4 pt-2 sm:px-6">
            <span className="sr-only">Loading workout</span>
            <Skeleton className="h-8 w-2/3" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <p className="text-footnote text-muted-foreground">
              {error
                ? "Couldn't load this workout. Check your connection and try again."
                : "This workout isn't available on this device."}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!("log" in item)) {
    return (
      <div>
        {back}
        <p className="px-4 py-16 text-center text-footnote text-muted-foreground sm:px-6">
          {item.problem === "unsupported"
            ? "This workout was saved by a newer version of PowrFit. Update the app to view it."
            : "This workout's data couldn't be read."}
        </p>
      </div>
    );
  }

  const { log } = item;
  if (mode === "edit") {
    return (
      <WorkoutEditor
        initial={log}
        onClose={() => setMode("view")}
        onDeleted={() => setMode("deleted")}
      />
    );
  }

  const totals = workoutTotals(log.exercises, unit);
  const logRecords = records.get(log.id) ?? [];

  return (
    <div className="pb-10">
      {back}
      <header className="px-4 pb-4 sm:px-6" data-sync-status={item.status}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-footnote text-muted-foreground">{formatDate(log.endedAt)}</p>
            <h1 className="mt-1 text-title2 font-bold">{log.routineName ?? "Workout"}</h1>
          </div>
          <button
            type="button"
            onClick={() => setMode("edit")}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border px-4 text-footnote font-semibold text-foreground hover:bg-surface"
          >
            <Pencil className="size-4" aria-hidden />
            Edit
          </button>
        </div>
        {item.status !== "synced" && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SyncBadge status={item.status} />
          </div>
        )}
      </header>

      {item.status === "failed" && (
        <div className="mx-4 mb-4 rounded-card border border-danger/40 bg-surface p-4 sm:mx-6">
          <FailedSaveActions log={log} errorCode={item.errorCode} />
        </div>
      )}

      {logRecords.length > 0 && <RecordsCard records={logRecords} unit={unit} celebrate={celebrate} />}

      <StatGrid label="Workout totals" columns={4} className="mx-4 sm:mx-6">
        {[
          ["Duration", formatDuration(log.startedAt, log.endedAt)],
          ["Volume", formatWeight(totals.volume, unit)],
          ["Sets", String(totals.sets)],
          ["Reps", String(totals.reps)],
          ...(totals.cardioSec > 0 ? [["Cardio", formatCardioMinutes(totals.cardioSec)]] : []),
        ].map(([label, value]) => (
          <StatTile key={label} label={label} value={value} />
        ))}
      </StatGrid>

      <SaveAsRoutine log={log} />

      <ol className="mx-4 mt-4 flex flex-col gap-3 sm:mx-6">
        {log.exercises.map((exercise, index) => (
          <li key={`${exercise.exerciseId}-${index}`} className="rounded-card border border-border bg-surface p-4">
            <h2 className="font-bold">{exercise.exerciseName}</h2>
            {exercise.note && (
              <p className="mt-1 whitespace-pre-line break-words text-footnote text-muted-foreground italic">
                {exercise.note}
              </p>
            )}
            <RecordLine
              record={logRecords.find((record) => record.exerciseId === exercise.exerciseId)}
              unit={unit}
            />
            <p className="text-caption text-muted-foreground">{unit} × reps</p>
            <ol className="mt-2 flex flex-col gap-1 text-footnote">
              {exercise.sets.map((set, setIndex) => (
                <li key={setIndex} className="flex gap-3">
                  <span className="w-5 text-muted-foreground">{setIndex + 1}</span>
                  <span className="tabular-nums">{formatSetsLine([set], unit)}</span>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The celebration: every PR from this workout, big, before the totals. */
function RecordsCard({
  records,
  unit,
  celebrate,
}: {
  records: readonly PersonalRecord[];
  unit: WeightUnit;
  celebrate: boolean;
}) {
  useEffect(() => {
    if (celebrate) haptic("success");
  }, [celebrate]);
  return (
    <section
      aria-label="New personal records"
      className="mx-4 mb-4 flex flex-col gap-3 rounded-card border border-accent/40 bg-accent-muted p-4 sm:mx-6"
    >
      <p className="flex items-center gap-2 text-headline font-bold">
        <Trophy className="size-6 text-accent" aria-hidden />
        {records.length === 1 ? "New personal record!" : `${records.length} new personal records!`}
      </p>
      <ul className="flex flex-col gap-1">
        {records.map((record) => (
          <li key={record.exerciseId} className="flex items-baseline justify-between gap-3 text-body">
            <span className="min-w-0 truncate">{record.exerciseName}</span>
            <span className="shrink-0 font-bold tabular-nums text-accent">
              {formatSetsLine([{ ...record, done: true }], unit)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-footnote text-muted-foreground">Heavier than any earlier workout. Nice lifting.</p>
    </section>
  );
}

function RecordLine({ record, unit }: { record?: PersonalRecord; unit: WeightUnit }) {
  if (!record) return null;
  return (
    <p className="mt-1 flex items-center gap-2 text-footnote">
      <PrBadge label="PR" />
      <span className="tabular-nums">{formatSetsLine([{ ...record, done: true }], unit)}</span>
    </p>
  );
}
