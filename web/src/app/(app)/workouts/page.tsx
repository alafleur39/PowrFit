import { ScreenHeader } from "@/components/shell/placeholder";
import { WorkoutsTabs } from "@/components/workout/workouts-tabs";

// Workouts: routines to start (the user's own and the presets, P4-02),
// workout history (P2-11) and the exercise catalog (P5-03).
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
