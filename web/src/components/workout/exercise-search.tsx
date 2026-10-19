"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  EQUIPMENT,
  MUSCLE_GROUPS,
  searchExercises,
  type Equipment,
  type MuscleGroup,
} from "@/lib/strength";
import { cn } from "@/lib/utils";

/** "Full body", "Barbell": catalog values as labels. */
export const catalogLabel = (value: string) =>
  value === "full-body" ? "Full body" : value.charAt(0).toUpperCase() + value.slice(1);

/** Search text and filters over the built-in catalog, and the matches. */
export function useExerciseSearch() {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | undefined>();
  const [equipment, setEquipment] = useState<Equipment | undefined>();
  const results = useMemo(
    () => searchExercises(query, { muscle, equipment }),
    [query, muscle, equipment]
  );
  return { query, setQuery, muscle, setMuscle, equipment, setEquipment, results };
}

// Search box, muscle chips and equipment filter (design spec §6.3), shared
// by the exercise picker and the Explore tab (P5-03).
export function ExerciseSearchControls({
  search,
}: {
  search: ReturnType<typeof useExerciseSearch>;
}) {
  const { query, setQuery, muscle, setMuscle, equipment, setEquipment } = search;
  return (
    <div className="flex flex-col gap-3">
      <label className="relative block">
        <span className="sr-only">Search exercises</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search exercises"
          className="h-11 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none"
        />
      </label>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Muscle">
        {MUSCLE_GROUPS.map((group) => (
          <button
            key={group}
            type="button"
            aria-pressed={muscle === group}
            onClick={() => setMuscle(muscle === group ? undefined : group)}
            className={cn(
              "h-11 shrink-0 rounded-full border px-4 text-sm font-medium",
              muscle === group
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            )}
          >
            {catalogLabel(group)}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        Equipment
        <select
          value={equipment ?? ""}
          onChange={(event) => setEquipment((event.target.value || undefined) as Equipment | undefined)}
          className="h-11 rounded-lg border border-input bg-background px-2 text-foreground"
        >
          <option value="">Any</option>
          {EQUIPMENT.map((item) => (
            <option key={item} value={item}>
              {catalogLabel(item)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
