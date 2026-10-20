"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { EmptyState } from "@/components/shell/placeholder";
import { SegmentedTabs } from "@/components/shell/segmented-tabs";
import type { WeightUnit, WorkoutLog } from "@/lib/strength";
import { formatWeight } from "@/lib/workout/format";
import {
  exerciseTrend,
  trendExercises,
  volumeBuckets,
  type ProgressRange,
} from "@/lib/workout/progress";
import { useActiveWorkout } from "./active-workout-provider";
import { ForYou } from "./for-you";
import { TrendChart, VolumeChart } from "./progress-charts";
import { useHistoryLogs } from "./use-records";

const RANGES: { id: ProgressRange; label: string; period: string; per: string }[] = [
  { id: "week", label: "Week", period: "this week", per: "day" },
  { id: "month", label: "Month", period: "this month", per: "week" },
  { id: "year", label: "Year", period: "this year", per: "month" },
];

const field =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground focus-visible:border-ring focus-visible:outline-none";

function Loading() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
    </div>
  );
}

// Progress (P4-06, D25): volume bars for this week, month or year, and the
// top-set trend of one exercise across all loaded history (HISTORY_LIMIT).
export function ProgressView() {
  const { unit } = useActiveWorkout();
  const { logs, loading } = useHistoryLogs();
  // The calendar period is fixed when the page opens.
  const [now] = useState(() => new Date());

  return (
    <div className="pb-10">
      <SegmentedTabs
        ariaLabel="Progress range"
        tabs={RANGES.map((range) => ({
          id: range.id,
          label: range.label,
          content: loading ? (
            <Loading />
          ) : (
            <VolumePanel logs={logs} range={range} unit={unit} now={now} />
          ),
        }))}
      />
      {!loading && <TrendPanel logs={logs} unit={unit} />}
      <ForYou className="mt-2 border-t border-border px-4 py-5 sm:px-6" />
    </div>
  );
}

function VolumePanel({
  logs,
  range,
  unit,
  now,
}: {
  logs: WorkoutLog[];
  range: (typeof RANGES)[number];
  unit: WeightUnit;
  now: Date;
}) {
  const buckets = useMemo(() => volumeBuckets(logs, range.id, unit, now), [logs, range.id, unit, now]);
  const workouts = buckets.reduce((sum, bucket) => sum + bucket.workouts, 0);
  const volume = buckets.reduce((sum, bucket) => sum + bucket.volume, 0);

  if (workouts === 0) {
    return (
      <EmptyState
        title={`No workouts ${range.period}`}
        hint={`Finish a workout and its volume will chart here, per ${range.per}.`}
      />
    );
  }

  return (
    <section aria-label={`Volume ${range.period}`} className="px-4 py-5 sm:px-6">
      <dl className="mb-4 flex gap-6">
        <div>
          <dt className="text-xs text-muted-foreground">Volume</dt>
          <dd className="font-mono text-xl font-bold tabular-nums text-accent">
            {formatWeight(volume, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Workouts</dt>
          <dd className="font-mono text-xl font-bold tabular-nums">{workouts}</dd>
        </div>
      </dl>
      <VolumeChart buckets={buckets} unit={unit} caption={`Volume per ${range.per} ${range.period}`} />
    </section>
  );
}

function TrendPanel({ logs, unit }: { logs: WorkoutLog[]; unit: WeightUnit }) {
  const exercises = useMemo(() => trendExercises(logs), [logs]);
  const [picked, setPicked] = useState<string | null>(null);
  // The most-logged exercise until the user picks one (or theirs is deleted).
  const current = exercises.find((exercise) => exercise.exerciseId === picked) ?? exercises[0];
  const points = useMemo(
    () => (current ? exerciseTrend(logs, current.exerciseId, unit) : []),
    [logs, current, unit]
  );

  return (
    <section aria-labelledby="trend-heading" className="mt-2 border-t border-border px-4 py-5 sm:px-6">
      <h2 id="trend-heading" className="text-lg font-bold">
        Exercise trend
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Heaviest finished set in each workout.</p>
      {!current ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Finish a workout to see how your lifts change over time.
        </p>
      ) : (
        <>
          {/* Not a wrapping label: that would add the chosen option to its name. */}
          <div className="mt-4 flex max-w-lg flex-col gap-1.5">
            <label htmlFor="trend-exercise" className="text-sm font-medium">
              Exercise
            </label>
            <select
              id="trend-exercise"
              value={current.exerciseId}
              onChange={(event) => setPicked(event.target.value)}
              className={field}
            >
              {exercises.map((exercise) => (
                <option key={exercise.exerciseId} value={exercise.exerciseId}>
                  {exercise.exerciseName}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <TrendChart points={points} unit={unit} exerciseName={current.exerciseName} />
          </div>
          {points.length === 1 && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Log {current.exerciseName} again to see a trend.
            </p>
          )}
        </>
      )}
    </section>
  );
}
