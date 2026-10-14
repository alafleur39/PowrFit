import { EmptyState, ScreenHeader } from "@/components/shell/placeholder";

// Inline stat chips show in-content on mobile/tablet; at lg the dedicated
// StatsRail takes over, so these hide (POWRFIT_NAV_SPEC §4).
const INLINE_STATS = [
  { label: "This week", value: "0" },
  { label: "Streak", value: "0d" },
  { label: "Goal", value: "0%" },
];

export default function HomePage() {
  return (
    <div>
      <ScreenHeader title="Home" subtitle="Your training at a glance." />

      <div className="grid grid-cols-3 gap-3 px-4 sm:px-6 lg:hidden">
        {INLINE_STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-surface p-3"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-xl font-bold text-accent">{stat.value}</p>
          </div>
        ))}
      </div>

      <EmptyState
        title="Home feed coming soon"
        hint="Today's mission, streaks, and recent sessions will land here once content is wired."
      />
    </div>
  );
}
