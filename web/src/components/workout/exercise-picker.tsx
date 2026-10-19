"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog } from "./dialog";
import { catalogLabel, ExerciseSearchControls, useExerciseSearch } from "./exercise-search";

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
  const search = useExerciseSearch();
  const { results } = search;
  const [selected, setSelected] = useState<string[]>([]);

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
      <div className="sticky top-0 z-10 bg-surface-raised pb-3">
        <ExerciseSearchControls search={search} />
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
                      {catalogLabel(exercise.primaryMuscle)} · {catalogLabel(exercise.equipment)}
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
