"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  EQUIPMENT,
  MUSCLE_GROUPS,
  searchExercises,
  type Equipment,
  type MuscleGroup,
} from "@/lib/strength";
import { cn } from "@/lib/utils";
import { Dialog } from "./dialog";

const label = (value: string) =>
  value === "full-body" ? "Full body" : value.charAt(0).toUpperCase() + value.slice(1);

// Exercise picker (design spec §6.3): search, muscle chips and an equipment
// filter over the built-in catalog. Runs on the device, so it works offline.
export function ExercisePicker({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (exerciseIds: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | undefined>();
  const [equipment, setEquipment] = useState<Equipment | undefined>();
  const [selected, setSelected] = useState<string[]>([]);

  const results = useMemo(
    () => searchExercises(query, { muscle, equipment }),
    [query, muscle, equipment]
  );

  const close = () => {
    setSelected([]);
    onClose();
  };

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );

  return (
    <Dialog
      open={open}
      title="Add exercises"
      onClose={close}
      footer={
        <Button
          className="h-12 w-full text-base font-bold"
          disabled={selected.length === 0}
          onClick={() => {
            onAdd(selected);
            close();
          }}
        >
          Add {selected.length > 0 ? `(${selected.length})` : ""}
        </Button>
      }
    >
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-surface-raised pb-3">
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
                "h-9 shrink-0 rounded-full border px-3 text-sm font-medium",
                muscle === group
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              )}
            >
              {label(group)}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Equipment
          <select
            value={equipment ?? ""}
            onChange={(event) =>
              setEquipment((event.target.value || undefined) as Equipment | undefined)
            }
            className="h-9 rounded-lg border border-input bg-background px-2 text-foreground"
          >
            <option value="">Any</option>
            {EQUIPMENT.map((item) => (
              <option key={item} value={item}>
                {label(item)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {results.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No exercises match.</p>
      ) : (
        <ul className="flex flex-col">
          {results.map((exercise) => {
            const isSelected = selected.includes(exercise.id);
            return (
              <li key={exercise.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={() => toggle(exercise.id)}
                  className="flex min-h-14 w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface"
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md border",
                      isSelected ? "border-accent bg-accent text-accent-foreground" : "border-border"
                    )}
                  >
                    {isSelected && <Check className="size-4" aria-hidden />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">{exercise.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {label(exercise.primaryMuscle)} · {label(exercise.equipment)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
