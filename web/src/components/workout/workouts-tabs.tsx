"use client";

import { SegmentedTabs } from "@/components/shell/segmented-tabs";
import { HistoryList } from "./history-list";
import { RoutineList } from "./routine-list";

export function WorkoutsTabs({ initialTab }: { initialTab?: string }) {
  return (
    <SegmentedTabs
      ariaLabel="Workouts views"
      defaultTabId={initialTab === "history" ? "history" : "routines"}
      tabs={[
        { id: "routines", label: "Routines", content: <RoutineList /> },
        { id: "history", label: "History", content: <HistoryList /> },
      ]}
    />
  );
}
