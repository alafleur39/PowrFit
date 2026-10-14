import { EmptyState, ScreenHeader } from "@/components/shell/placeholder";
import { SegmentedTabs } from "@/components/shell/segmented-tabs";

// Workouts section with the segmented top tabs from the spec example
// (My plans / Explore / History) — POWRFIT_NAV_SPEC §3.
export default function WorkoutsPage() {
  return (
    <div>
      <ScreenHeader title="Workouts" />
      <SegmentedTabs
        ariaLabel="Workouts views"
        tabs={[
          {
            id: "my-plans",
            label: "My plans",
            content: (
              <EmptyState
                title="No plans yet"
                hint="Your saved training plans will show up here."
              />
            ),
          },
          {
            id: "explore",
            label: "Explore",
            content: (
              <EmptyState
                title="Explore workouts"
                hint="Browse the workout library once content is wired."
              />
            ),
          },
          {
            id: "history",
            label: "History",
            content: (
              <EmptyState
                title="No history yet"
                hint="Completed sessions will appear here after you log a workout."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
