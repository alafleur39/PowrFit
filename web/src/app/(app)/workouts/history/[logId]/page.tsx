"use client";

import { useParams } from "next/navigation";

import { WorkoutSummary } from "@/components/workout/workout-summary";

export default function WorkoutSummaryPage() {
  const { logId } = useParams<{ logId: string }>();
  return <WorkoutSummary logId={logId} />;
}
