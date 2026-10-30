"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { WorkoutSummary } from "@/components/workout/workout-summary";

// One saved workout, /workouts/history/view?id=<logId> (P7-01: query, not
// path, so the static iOS build has this page too).
function SavedWorkout() {
  const logId = useSearchParams().get("id") ?? "";
  return <WorkoutSummary logId={logId} />;
}

export default function WorkoutSummaryPage() {
  return (
    <Suspense>
      <SavedWorkout />
    </Suspense>
  );
}
