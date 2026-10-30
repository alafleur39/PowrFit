import { redirect } from "next/navigation";

// The old mock workout pages (/workouts/hiit-burner and friends) were retired
// in Phase 2 (P2-15, D19). Old links land on Workouts instead of a 404.
export default function LegacyWorkoutPage() {
  redirect("/workouts");
}
