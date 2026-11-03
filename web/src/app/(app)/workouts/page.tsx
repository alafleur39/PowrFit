"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { WorkoutsTabs } from "@/components/workout/workouts-tabs";

// Workouts: routines to start (the user's own and the presets, P4-02),
// workout history (P2-11) and the exercise catalog (P5-03). Reads ?tab= in
// the browser so the static iOS build can include it (P7-01).
function Tabs() {
  const tab = useSearchParams().get("tab") ?? undefined;
  return <WorkoutsTabs initialTab={tab} />;
}

export default function WorkoutsPage() {
  const router = useRouter();
  return (
    <div>
      <ScreenHeader
        title="Workouts"
        action={
          // The way into the logger (it resumes a workout in progress), now that there's no "+".
          <Button onClick={() => router.push("/log")}>Start workout</Button>
        }
      />
      <Suspense>
        <Tabs />
      </Suspense>
    </div>
  );
}
