"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Dumbbell, Plus } from "lucide-react";

import { ScreenHeader } from "@/components/shell/placeholder";
import { useActiveWorkout } from "@/components/workout/active-workout-provider";
import { SyncBadge } from "@/components/workout/sync-badge";
import { useNow } from "@/components/workout/use-now";
import { useRecentWorkouts } from "@/components/workout/use-workout-logs";
import { useWeekStats } from "@/components/workout/use-week-stats";
import { PRESET_ROUTINES, workoutTotals } from "@/lib/strength";
import { formatDate, formatElapsed, formatWeight } from "@/lib/workout/format";

// Home is a training dashboard (D13, design spec §6.1): resume or start a
// workout, this week's numbers, and the last workout.
export default function HomePage() {
  return (
    <div className="pb-6">
      <ScreenHeader title="Home" subtitle="Your training at a glance." />
      <div className="flex flex-col gap-4 px-4 sm:px-6">
        <StartOrResume />
        <WeekChips />
        <LastWorkout />
      </div>
    </div>
  );
}

function StartOrResume() {
  const router = useRouter();
  const { ready, draft, start } = useActiveWorkout();
  const now = useNow();
  const { items } = useRecentWorkouts(1);

  if (!ready) return <div className="h-32 rounded-2xl border border-border bg-surface" />;

  if (draft) {
    return (
      <Link
        href="/log"
        className="flex items-center justify-between gap-3 rounded-2xl border border-accent/50 bg-surface-active p-4"
      >
        <span className="min-w-0">
          <span className="block text-xs font-semibold tracking-wide text-accent uppercase">
            In progress · <span className="font-mono tabular-nums">{formatElapsed(draft.startedAt, now)}</span>
          </span>
          <span className="block truncate text-lg font-bold">{draft.routineName ?? "Workout"}</span>
          <span className="block text-sm text-muted-foreground">Tap to keep logging</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-accent" aria-hidden />
      </Link>
    );
  }

  // Suggest the preset after the last one done (Push → Pull → Leg).
  const lastRoutine = items.find((item) => "log" in item && item.log.routineId);
  const lastIndex = PRESET_ROUTINES.findIndex(
    (routine) => lastRoutine && "log" in lastRoutine && routine.id === lastRoutine.log.routineId
  );
  const next = PRESET_ROUTINES[(lastIndex + 1) % PRESET_ROUTINES.length];
  const isFirst = items.length === 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {isFirst ? "Start your first workout" : "Up next"}
      </p>
      <p className="mt-1 text-lg font-bold">{next.name}</p>
      <p className="text-sm text-muted-foreground">{next.notes}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            start(next);
            router.push("/log");
          }}
          className="brand-glow flex h-11 items-center gap-2 rounded-full bg-accent px-5 font-bold text-accent-foreground"
        >
          <Dumbbell className="size-4" aria-hidden />
          Start {next.name}
        </button>
        <button
          type="button"
          onClick={() => {
            start();
            router.push("/log");
          }}
          className="flex h-11 items-center gap-2 rounded-full border border-border px-5 font-semibold text-foreground hover:bg-surface-raised"
        >
          <Plus className="size-4" aria-hidden />
          Empty workout
        </button>
      </div>
    </div>
  );
}

// Inline on phones and tablets; at lg the StatsRail shows the same numbers.
function WeekChips() {
  const { stats } = useWeekStats();
  const chips = [
    { label: "Workouts", value: String(stats.workouts) },
    { label: "Sets", value: String(stats.sets) },
    { label: "Volume", value: formatWeight(stats.volume, stats.unit) },
  ];
  return (
    <section aria-label="This week" className="lg:hidden">
      <h2 className="mb-2 text-sm font-bold">This week</h2>
      <div className="grid grid-cols-3 gap-3">
        {chips.map((chip) => (
          <div key={chip.label} className="rounded-xl border border-border bg-surface p-3">
            <p className="text-xs text-muted-foreground">{chip.label}</p>
            <p className="mt-1 truncate font-mono text-lg font-bold tabular-nums text-accent">
              {chip.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LastWorkout() {
  const { unit } = useActiveWorkout();
  const { items, loading } = useRecentWorkouts(1);
  const last = items.find((item) => "log" in item);

  if (loading && !last) return null;
  if (!last || !("log" in last)) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
        Your finished workouts will show up here.
      </p>
    );
  }

  const totals = workoutTotals(last.log.exercises, unit);
  return (
    <section aria-label="Last workout">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold">Last workout</h2>
        <Link href="/workouts?tab=history" className="text-sm font-medium text-accent">
          All history
        </Link>
      </div>
      <Link
        href={`/workouts/history/${last.id}`}
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted-foreground">{formatDate(last.log.endedAt)}</span>
          <span className="block truncate font-bold">{last.log.routineName ?? "Workout"}</span>
          <span className="block text-sm text-muted-foreground">
            {totals.sets} sets ·{" "}
            <span className="font-mono tabular-nums">{formatWeight(totals.volume, unit)}</span>
          </span>
          <SyncBadge status={last.status} className="mt-1" />
        </span>
        <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
      </Link>
    </section>
  );
}
