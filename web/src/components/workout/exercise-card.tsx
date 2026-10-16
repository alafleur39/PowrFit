"use client";

import { Plus, Trash2 } from "lucide-react";

import type { DraftExercise, LoggedSet, WeightUnit } from "@/lib/strength";
import { formatSetsLine } from "@/lib/workout/format";
import { SetRow } from "./set-row";

export function ExerciseCard({
  exercise,
  lastSets,
  unit,
  onChangeSet,
  onToggleSet,
  onRemoveSet,
  onAddSet,
  onRemove,
}: {
  exercise: DraftExercise;
  lastSets: readonly LoggedSet[] | undefined;
  unit: WeightUnit;
  onChangeSet: (index: number, patch: { weight?: number | null; reps?: number | null }) => void;
  onToggleSet: (index: number) => void;
  onRemoveSet: (index: number) => void;
  onAddSet: () => void;
  onRemove: () => void;
}) {
  return (
    <section
      aria-label={exercise.exerciseName}
      className="rounded-2xl border border-border bg-surface p-3 sm:p-4"
    >
      <div className="flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2 className="break-words text-base font-bold text-foreground">{exercise.exerciseName}</h2>
          {lastSets && lastSets.length > 0 && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Last: <span className="font-mono tabular-nums">{formatSetsLine(lastSets, unit)}</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${exercise.exerciseName}`}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-raised hover:text-danger"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      <div
        className="mt-3 grid grid-cols-[2rem_1fr_1fr_3rem_2.25rem] gap-2 px-1 text-xs font-medium text-muted-foreground"
        aria-hidden
      >
        <span className="text-center">Set</span>
        <span className="text-center">Weight</span>
        <span className="text-center">Reps</span>
        <span className="text-center">Done</span>
        <span />
      </div>
      <ol className="mt-1 flex flex-col gap-1">
        {exercise.sets.map((set, index) => (
          <SetRow
            key={index}
            index={index}
            set={set}
            targetReps={exercise.targetReps}
            onChange={(patch) => onChangeSet(index, patch)}
            onToggle={() => onToggleSet(index)}
            onRemove={() => onRemoveSet(index)}
          />
        ))}
      </ol>

      <button
        type="button"
        onClick={onAddSet}
        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-accent hover:bg-surface-raised"
      >
        <Plus className="size-4" aria-hidden />
        Add set
      </button>
    </section>
  );
}
