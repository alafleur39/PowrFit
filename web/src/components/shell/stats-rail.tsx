// Right stats rail — appears only at lg (POWRFIT_NAV_SPEC §4). Placeholder
// chips for now; real stats get wired after the shell is approved. Key numbers
// use yellow (accent); labels stay muted/white.
const STATS = [
  { label: "Workouts this week", value: "0" },
  { label: "Active streak", value: "0d" },
  { label: "Weekly goal", value: "0%" },
];

export function StatsRail() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 overflow-y-auto py-5 pl-6 lg:block">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-bold text-foreground">This week</h2>
        <dl className="mt-4 space-y-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="text-xl font-bold text-accent">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}
