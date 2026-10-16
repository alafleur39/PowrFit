import { ScreenHeader } from "@/components/shell/placeholder";
import { WorkoutsTabs } from "@/components/workout/workouts-tabs";

// Workouts: preset routines to start, and workout history (P2-11). "My
// plans" returns with the routine editor (deferred to a later phase).
export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return (
    <div>
      <ScreenHeader title="Workouts" />
      <WorkoutsTabs initialTab={tab} />
    </div>
  );
}
