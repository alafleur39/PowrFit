"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Dumbbell, MapPin, Plus } from "lucide-react";

import { InstallCard } from "@/components/install-card";
import { ForYou } from "@/components/workout/for-you";
import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatGrid, StatTile } from "@/components/ui/stat-tile";
import { useHistoryLogs } from "@/components/workout/use-records";
import { useActiveWorkout } from "@/components/workout/active-workout-provider";
import { SyncBadge } from "@/components/workout/sync-badge";
import { useNow } from "@/components/workout/use-now";
import { useRecentWorkouts } from "@/components/workout/use-workout-logs";
import { useWeekStats } from "@/components/workout/use-week-stats";
import { PRESET_ROUTINES, workoutTotals } from "@/lib/strength";
import { formatCardioMinutes, formatCardioSuffix, formatDate, formatElapsed, formatWeight, formatWeightAmount, plural, weekStart } from "@/lib/workout/format";
import { workoutLogHref } from "@/lib/routes";
import { weekStreak } from "@/lib/workout/week-stats";

// Home is a training dashboard (D13, design spec §6.1): resume or start a
// workout, this week's numbers, and the last workout. From the 2nd workout,
// a card suggests installing the app (D26).
export default function HomePage() {
  return (
    <div className="pb-6">
      <ScreenHeader title="Home" brand />
      <div className="flex flex-col gap-4 px-4 sm:px-6">
        <StartOrResume />
        <WeekChips />
        <ForYou />
        <GymsCard />
        <InstallCard />
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

  if (!ready) return <div className="h-32 rounded-card border border-border bg-surface" />;

  if (draft) {
    return (
      <Link
        href="/log"
        className="flex items-center justify-between gap-3 rounded-card border border-accent/50 bg-accent-muted p-4"
      >
        <span className="min-w-0">
          <span className="block text-caption font-semibold tracking-wide text-accent uppercase">
            In progress · <span className="tabular-nums">{formatElapsed(draft.startedAt, now)}</span>
          </span>
          <span className="block truncate text-headline font-bold">{draft.routineName ?? "Workout"}</span>
          <span className="block text-footnote text-muted-foreground">Tap to keep logging</span>
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
  // Why this one (UI playbook Phase 4): what came before it, in plain words
  // (Phase 7 review: "Push → Pull → Leg" read as jargon on a first visit).
  const reason =
    lastIndex >= 0 && lastRoutine && "log" in lastRoutine
      ? `After ${PRESET_ROUTINES[lastIndex].name} on ${formatDate(lastRoutine.log.endedAt)}.`
      : `Day 1 of ${PRESET_ROUTINES.length}: ${PRESET_ROUTINES.map((routine) => routine.name).join(", ")}.`;

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="text-footnote font-semibold text-muted-foreground">
        {isFirst ? "Start your first workout" : "Up next"}
      </p>
      <p className="mt-1 text-headline font-bold">{next.name}</p>
      <p className="text-footnote text-muted-foreground">{next.notes}</p>
      <p className="mt-1 text-footnote text-muted-foreground">{reason}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            start(next);
            router.push("/log");
          }}
        >
          <Dumbbell aria-hidden />
          Start {next.name}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            start();
            router.push("/log");
          }}
        >
          <Plus aria-hidden />
          Empty workout
        </Button>
      </div>
    </div>
  );
}

// Inline on phones and tablets; at lg the StatsRail shows the same numbers.
// A week with nothing yet says so and keeps the streak in view, instead of
// three zeros (UI playbook Phase 4).
function WeekChips() {
  const { stats, loading } = useWeekStats();
  const { logs, loading: historyLoading } = useHistoryLogs();
  const [now] = useState(() => new Date());
  const chips = [
    { label: "Workouts", value: String(stats.workouts) },
    { label: "Sets", value: String(stats.sets) },
    // The unit is set smaller so "1,140 lb" fits a 375px-wide phone.
    { label: "Volume", value: formatWeightAmount(stats.volume, stats.unit), unit: stats.unit },
    ...(stats.cardioSec > 0 ? [{ label: "Cardio", value: formatCardioMinutes(stats.cardioSec) }] : []),
  ];

  let body;
  if (loading || historyLoading) {
    body = <Skeleton className="h-20" />;
  } else if (stats.workouts > 0) {
    body = (
      <StatGrid label="This week's totals" columns={chips.length === 4 ? 2 : 3}>
        {chips.map((chip) => (
          <StatTile key={chip.label} label={chip.label} value={chip.value} unit={chip.unit} />
        ))}
      </StatGrid>
    );
  } else {
    const thisWeek = weekStart(now);
    const lastWeekStart = new Date(thisWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeek = logs.filter((log) => {
      const ended = new Date(log.endedAt);
      return ended >= lastWeekStart && ended < thisWeek;
    }).length;
    const streak = weekStreak(
      logs.map((log) => log.endedAt),
      now
    );
    body = (
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="text-body font-semibold">
          {logs.length === 0 ? "Your week starts with your first workout" : "New week, nothing logged yet"}
        </p>
        <p className="mt-1 text-footnote text-muted-foreground">
          {logs.length === 0
            ? "This week's workouts, sets and volume show up here. Weeks start on Monday."
            : `Last week: ${plural(lastWeek, "workout")}.${
                streak > 0 ? ` One this week keeps your ${streak}-week streak going.` : ""
              }`}
        </p>
      </div>
    );
  }

  return (
    <section aria-label="This week" className="lg:hidden">
      <h2 className="mb-2 text-footnote font-bold">This week</h2>
      {body}
    </section>
  );
}

// The way into gyms near you (P6-06).
function GymsCard() {
  return (
    <Link
      href="/gyms"
      className="flex min-h-14 items-center gap-3 rounded-card border border-border bg-surface p-4 hover:bg-surface-raised"
    >
      <MapPin className="size-6 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Gyms near you</span>
        <span className="block text-footnote text-muted-foreground">Compare monthly prices</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

function LastWorkout() {
  const { unit } = useActiveWorkout();
  const { items, loading } = useRecentWorkouts(1);
  const last = items.find((item) => "log" in item);

  if (loading && !last) return null;
  if (!last || !("log" in last)) {
    return (
      <p className="rounded-card border border-dashed border-border bg-surface p-6 text-center text-footnote text-muted-foreground">
        Your finished workouts will show up here.
      </p>
    );
  }

  const totals = workoutTotals(last.log.exercises, unit);
  return (
    <section aria-label="Last workout">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-footnote font-bold">Last workout</h2>
        <Link
          href="/workouts?tab=history"
          className="-my-3 flex min-h-11 items-center gap-0.5 text-footnote font-medium text-muted-foreground hover:text-foreground"
        >
          All history
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
      <Link
        href={workoutLogHref(last.id)}
        data-sync-status={last.status}
        className="flex items-center gap-3 rounded-card border border-border bg-surface p-4"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-caption text-muted-foreground">{formatDate(last.log.endedAt)}</span>
          <span className="block truncate font-bold">{last.log.routineName ?? "Workout"}</span>
          <span className="block text-footnote text-muted-foreground">
            {plural(totals.sets, "set")} ·{" "}
            <span className="tabular-nums">{formatWeight(totals.volume, unit)}</span>
            {formatCardioSuffix(totals.cardioSec)}
          </span>
          <SyncBadge status={last.status} className="mt-1" />
        </span>
        <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
      </Link>
    </section>
  );
}
