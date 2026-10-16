"use client";

import { useRouter } from "next/navigation";

import { SegmentedTabs } from "@/components/shell/segmented-tabs";
import { PRESET_ROUTINES } from "@/lib/strength";
import { useActiveWorkout } from "./active-workout-provider";
import { HistoryList } from "./history-list";

function PresetList() {
  const router = useRouter();
  const { draft, start } = useActiveWorkout();

  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:px-6">
      {draft && (
        <p className="text-sm text-muted-foreground">
          Finish or discard your current workout before starting another.
        </p>
      )}
      {PRESET_ROUTINES.map((routine) => (
        <div key={routine.id} className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold">{routine.name}</h2>
              <p className="text-sm text-muted-foreground">{routine.notes}</p>
            </div>
            <button
              type="button"
              disabled={Boolean(draft)}
              onClick={() => {
                start(routine);
                router.push("/log");
              }}
              className="h-10 shrink-0 rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground disabled:opacity-40"
            >
              Start
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {routine.exercises.length} exercises ·{" "}
            {routine.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0)} sets
          </p>
        </div>
      ))}
    </div>
  );
}

export function WorkoutsTabs({ initialTab }: { initialTab?: string }) {
  return (
    <SegmentedTabs
      ariaLabel="Workouts views"
      defaultTabId={initialTab === "history" ? "history" : "presets"}
      tabs={[
        { id: "presets", label: "Presets", content: <PresetList /> },
        { id: "history", label: "History", content: <HistoryList /> },
      ]}
    />
  );
}
