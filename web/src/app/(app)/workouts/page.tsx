"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ScreenHeader } from "@/components/shell/placeholder";
import { WorkoutsTabs } from "@/components/workout/workouts-tabs";

// Workouts: routines to start (the user's own and the presets, P4-02),
// workout history (P2-11) and the exercise catalog (P5-03). Reads ?tab= in
// the browser so the static iOS build can include it (P7-01).
function Tabs() {
  const tab = useSearchParams().get("tab") ?? undefined;
  return <WorkoutsTabs initialTab={tab} />;
}

export default function WorkoutsPage() {
  return (
    <div>
      <ScreenHeader title="Workouts" />
      <Suspense>
        <Tabs />
      </Suspense>
    </div>
  );
}
