"use client";

import { useMemo, useState } from "react";

import { weekStart } from "@/lib/workout/format";
import { summarizeWeek } from "@/lib/workout/week-stats";
import { useActiveWorkout } from "./active-workout-provider";
import { useWorkoutsSince } from "./use-workout-logs";

/** This week's workouts (Monday 00:00 local onward) and their totals. */
export function useWeekStats() {
  const { unit } = useActiveWorkout();
  const [since] = useState(() => weekStart(new Date()).toISOString());
  const { items, loading } = useWorkoutsSince(since);
  const stats = useMemo(() => summarizeWeek(items, unit), [items, unit]);
  return { stats, items, loading };
}
