"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { EXERCISES, type Exercise } from "@/lib/strength";
import { formatDate, formatWeight } from "@/lib/workout/format";
import { exerciseTrend } from "@/lib/workout/progress";
import { useActiveWorkout } from "./active-workout-provider";
import { catalogLabel, ExerciseSearchControls, useExerciseSearch } from "./exercise-search";
import { TrendChart } from "./progress-charts";
import { useHistoryLogs } from "./use-records";

// Explore (P5-03, D28): the built-in catalog with search and filters, and a
// detail for each exercise with the user's own numbers. The detail opens in
// place rather than on its own route, so it works offline like the rest.
export function Explore() {
  const search = useExerciseSearch();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = EXERCISES.find((exercise) => exercise.id === openId);

  if (open) return <ExerciseDetail exercise={open} onBack={() => setOpenId(null)} />;

  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:px-6">
      <ExerciseSearchControls search={search} />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {search.results.length} {search.results.length === 1 ? "exercise" : "exercises"}
      </p>
      {search.results.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No exercises match.</p>
      ) : (
        <ul className="flex flex-col" aria-label="Exercises">
          {search.results.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                onClick={() => setOpenId(exercise.id)}
                className="flex min-h-14 w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{exercise.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {catalogLabel(exercise.primaryMuscle)} · {catalogLabel(exercise.equipment)}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExerciseDetail({ exercise, onBack }: { exercise: Exercise; onBack: () => void }) {
  const { unit } = useActiveWorkout();
  const { logs, loading } = useHistoryLogs();
  const points = useMemo(() => exerciseTrend(logs, exercise.id, unit), [logs, exercise.id, unit]);
  const best = points.reduce<(typeof points)[number] | undefined>(
    (top, point) => (!top || point.weight > top.weight ? point : top),
    undefined
  );
  const last = points[points.length - 1];

  const facts = [
    ["Main muscle", catalogLabel(exercise.primaryMuscle)],
    ...(exercise.secondaryMuscles.length > 0
      ? [["Also works", exercise.secondaryMuscles.map(catalogLabel).join(", ")]]
      : []),
    ["Equipment", catalogLabel(exercise.equipment)],
    ["Type", catalogLabel(exercise.mechanic)],
  ];

  return (
    <div className="pb-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-11 items-center gap-2 px-4 text-sm font-medium text-muted-foreground hover:text-foreground sm:px-6"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All exercises
      </button>
      <div className="flex flex-col gap-4 px-4 sm:px-6">
        <h2 className="text-2xl font-bold">{exercise.name}</h2>

        <dl className="grid grid-cols-2 gap-3">
          {facts.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-surface p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-sm font-semibold">{value}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="your-numbers" className="flex flex-col gap-3">
          <h3 id="your-numbers" className="text-lg font-bold">
            Your numbers
          </h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading your history…</p>
          ) : !best || !last ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t logged {exercise.name} yet. Your best set and trend will show here.
            </p>
          ) : (
            <>
              <dl className="grid grid-cols-3 gap-3">
                {[
                  ["Best", formatWeight(best.weight, unit)],
                  ["Workouts", String(points.length)],
                  ["Last", formatDate(last.endedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border bg-surface p-3">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 truncate font-mono text-base font-bold tabular-nums text-accent">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <TrendChart points={points} unit={unit} exerciseName={exercise.name} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
