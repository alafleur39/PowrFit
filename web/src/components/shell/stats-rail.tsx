"use client";

import { useWeekStats } from "@/components/workout/use-week-stats";
import { formatWeight } from "@/lib/workout/format";

// Right stats rail — appears only at lg (POWRFIT_NAV_SPEC §4). Same numbers
// as Home's inline stats (one hook). Key numbers use yellow; labels muted.
export function StatsRail() {
  const { stats } = useWeekStats();
  const rows = [
    { label: "Workouts", value: String(stats.workouts) },
    { label: "Sets", value: String(stats.sets) },
    { label: "Volume", value: formatWeight(stats.volume, stats.unit) },
  ];

  return (
    <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 overflow-y-auto py-5 pl-6 lg:block">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-bold text-foreground">This week</h2>
        <dl className="mt-4 space-y-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
              <dd className="font-mono text-xl font-bold tabular-nums text-accent">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}
