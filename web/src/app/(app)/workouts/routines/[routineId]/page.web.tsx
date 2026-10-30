import { redirect } from "next/navigation";

import { routineHref } from "@/lib/routes";

// Website only (P7-01): old /workouts/routines/<routineId> links land on the
// query-style page. The static iOS build leaves .web.tsx files out.
export default async function LegacyRoutineEditorPage({ params }: { params: Promise<{ routineId: string }> }) {
  const { routineId } = await params;
  redirect(routineHref(routineId));
}
