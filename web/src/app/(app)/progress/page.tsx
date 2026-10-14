import { EmptyState, ScreenHeader } from "@/components/shell/placeholder";
import { SegmentedTabs } from "@/components/shell/segmented-tabs";

export default function ProgressPage() {
  return (
    <div>
      <ScreenHeader title="Progress" />
      <SegmentedTabs
        ariaLabel="Progress range"
        tabs={[
          {
            id: "week",
            label: "Week",
            content: (
              <EmptyState
                title="No data this week"
                hint="Weekly volume and streaks will chart here."
              />
            ),
          },
          {
            id: "month",
            label: "Month",
            content: (
              <EmptyState
                title="No data this month"
                hint="Monthly trends will chart here."
              />
            ),
          },
          {
            id: "year",
            label: "Year",
            content: (
              <EmptyState
                title="No data this year"
                hint="Yearly milestones will chart here."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
