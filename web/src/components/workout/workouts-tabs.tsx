"use client";

import { Tabs } from "@/components/ui/tabs";
import { Explore } from "./explore";
import { HistoryList } from "./history-list";
import { RoutineList } from "./routine-list";

export function WorkoutsTabs({ initialTab }: { initialTab?: string }) {
  return (
    <Tabs
      ariaLabel="Workouts views"
      urlParam="tab"
      defaultTabId={initialTab === "history" || initialTab === "explore" ? initialTab : "routines"}
      tabs={[
        { id: "routines", label: "Routines", content: <RoutineList /> },
        { id: "history", label: "History", content: <HistoryList /> },
        { id: "explore", label: "Explore", content: <Explore /> },
      ]}
    />
  );
}
