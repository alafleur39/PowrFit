import { redirect } from "next/navigation";

import { workoutLogHref } from "@/lib/routes";

// Website only (P7-01): old /workouts/history/<logId> links land on the
// query-style page. The static iOS build leaves .web.tsx files out.
export default async function LegacyWorkoutSummaryPage({ params }: { params: Promise<{ logId: string }> }) {
  const { logId } = await params;
  redirect(workoutLogHref(logId));
}
