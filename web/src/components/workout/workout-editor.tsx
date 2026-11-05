"use client";

import { useState } from "react";
import { ArrowLeft, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  EXERCISES,
  cleanEditedLog,
  distanceUnitFor,
  editLogNote,
  editLogSet,
  isCardioSet,
  logProblems,
  removeLogExercise,
  removeLogSet,
  type CardioField,
  type CardioSet,
  type DistanceUnit,
  type WorkoutLog,
} from "@/lib/strength";
import { formatDate, parseRepsInput, parseWeightInput } from "@/lib/workout/format";
import { useActiveWorkout } from "./active-workout-provider";
import { CardioStatFields, CardioTimeField } from "./cardio-set-row";
import { Sheet } from "@/components/ui/sheet";
import { ExerciseNote } from "./exercise-note";
import { NumberField } from "./set-row";

const nowIso = () => new Date().toISOString();

const CARDIO_FIELDS = new Map(
  EXERCISES.flatMap((exercise) => (exercise.cardio ? [[exercise.id, exercise.cardio.fields] as const] : []))
);

// Editing a past workout (P4-05, D24). Shown in place of the summary rather
// than on its own route, because a route the device hasn't loaded can't open
// offline. Edits a local copy; nothing is written until Save. Saving goes through the same receipts as finishing a workout,
// so it works offline and shows "Not synced yet" until it's confirmed.
// Weights are edited in the unit each set was logged in. A cleared field is
// NaN until it's filled in again; logProblems blocks saving it. A cleared
// cardio stat is removed.
export function WorkoutEditor({
  initial,
  onClose,
  onDeleted,
}: {
  initial: WorkoutLog;
  /** Back to the summary, after Save or Cancel. */
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { saveEdit, deleteWorkout } = useActiveWorkout();
  const [log, setLog] = useState(initial);
  const [problems, setProblems] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const change = (next: (current: WorkoutLog, now: string) => WorkoutLog) =>
    setLog((current) => next(current, nowIso()));

  const save = () => {
    const found = logProblems(log);
    setProblems(found);
    if (found.length > 0) return;
    saveEdit(cleanEditedLog(log));
    onClose();
  };

  const remove = () => {
    setDeleteOpen(false);
    deleteWorkout(log.id);
    onDeleted();
  };

  return (
    <div className="pb-10">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex min-h-11 items-center gap-2 px-4 text-footnote font-medium text-muted-foreground hover:text-foreground sm:px-6"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Cancel
      </button>

      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 sm:px-6">
        <header>
          <p className="text-footnote text-muted-foreground">{formatDate(log.endedAt)}</p>
          <h1 className="mt-1 text-title2 font-bold">Edit workout</h1>
        </header>

        <ol className="flex flex-col gap-3" aria-label="Exercises">
          {log.exercises.map((exercise, exerciseIndex) => {
            const name = exercise.exerciseName;
            return (
              <li
                key={`${exercise.exerciseId}-${exerciseIndex}`}
                className="rounded-card border border-border bg-surface p-3"
              >
                <div className="flex items-center gap-1">
                  <h2 className="min-w-0 flex-1 truncate font-bold">{name}</h2>
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    onClick={() => change((l, now) => removeLogExercise(l, exerciseIndex, now))}
                    className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-raised hover:text-danger"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                {exercise.sets.length === 0 ? (
                  <p className="mt-2 text-footnote text-muted-foreground">
                    No sets left. This exercise will be removed when you save.
                  </p>
                ) : (
                  <ol className="mt-2 flex flex-col gap-2">
                    {exercise.sets.map((set, setIndex) => {
                      const number = setIndex + 1;
                      if (isCardioSet(set)) {
                        return (
                          <CardioEditRow
                            key={setIndex}
                            set={set}
                            label={`${name} set ${number}`}
                            fields={CARDIO_FIELDS.get(exercise.exerciseId) ?? []}
                            distanceUnit={set.distanceUnit ?? distanceUnitFor(log.totals.unit)}
                            onChange={(patch) =>
                              change((l, now) => editLogSet(l, exerciseIndex, setIndex, patch, now))
                            }
                            onRemove={() => change((l, now) => removeLogSet(l, exerciseIndex, setIndex, now))}
                          />
                        );
                      }
                      return (
                        <li
                          key={setIndex}
                          className="type-cap grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-2"
                        >
                          <span className="text-center tabular-nums text-footnote text-muted-foreground" aria-hidden>
                            {number}
                          </span>
                          <NumberField
                            value={Number.isNaN(set.weight) ? null : set.weight}
                            parse={parseWeightInput}
                            onValue={(weight) =>
                              change((l, now) =>
                                editLogSet(l, exerciseIndex, setIndex, { weight: weight ?? Number.NaN }, now)
                              )
                            }
                            label={`${name} set ${number} weight in ${set.unit}`}
                            placeholder={set.unit}
                            inputMode="decimal"
                          />
                          <NumberField
                            value={Number.isNaN(set.reps) ? null : set.reps}
                            parse={parseRepsInput}
                            onValue={(reps) =>
                              change((l, now) =>
                                editLogSet(l, exerciseIndex, setIndex, { reps: reps ?? Number.NaN }, now)
                              )
                            }
                            label={`${name} set ${number} reps`}
                            placeholder="reps"
                            inputMode="numeric"
                          />
                          <button
                            type="button"
                            aria-label={`Remove ${name} set ${number}`}
                            onClick={() => change((l, now) => removeLogSet(l, exerciseIndex, setIndex, now))}
                            className="flex size-11 items-center justify-center rounded-input text-muted-foreground hover:bg-surface-raised hover:text-danger"
                          >
                            <X className="size-4" aria-hidden />
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                )}
                <ExerciseNote
                  exerciseName={name}
                  note={exercise.note}
                  onChange={(note) => change((l, now) => editLogNote(l, exerciseIndex, note, now))}
                />
              </li>
            );
          })}
        </ol>

        {problems.length > 0 && (
          <ul role="alert" className="rounded-tile border border-danger/40 bg-surface p-3 text-footnote text-danger">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-3">
          <Button className="min-h-12 flex-1 text-body font-bold" onClick={save}>
            Save changes
          </Button>
          <Button
            variant="secondary"
            className="min-h-12 border-danger/50 bg-transparent text-body font-semibold text-danger hover:bg-surface"
            onClick={() => setDeleteOpen(true)}
          >
            Delete workout
          </Button>
        </div>
      </div>

      <Sheet
        open={deleteOpen}
        title="Delete this workout?"
        onClose={() => setDeleteOpen(false)}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="min-h-12 flex-1" onClick={() => setDeleteOpen(false)}>
              Keep it
            </Button>
            <Button variant="destructive" className="min-h-12 flex-1" onClick={remove}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-footnote text-muted-foreground">
          It will be removed from History, your stats and your personal records on every device.
          This can&apos;t be undone.
        </p>
      </Sheet>
    </div>
  );
}

/** A finished cardio set: time and remove, with the machine's stats below. */
function CardioEditRow({
  set,
  label,
  fields,
  distanceUnit,
  onChange,
  onRemove,
}: {
  set: CardioSet;
  label: string;
  fields: readonly CardioField[];
  distanceUnit: DistanceUnit;
  onChange: (patch: Partial<Omit<CardioSet, "done">>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-col gap-2">
      <div className="type-cap grid grid-cols-[2rem_1fr_2.75rem] items-center gap-2">
        <span className="text-center tabular-nums text-footnote text-muted-foreground" aria-hidden>
          {label.split(" ").at(-1)}
        </span>
        <CardioTimeField
          value={Number.isNaN(set.durationSec) ? null : set.durationSec}
          onValue={(durationSec) => onChange({ durationSec: durationSec ?? Number.NaN })}
          label={`${label} time`}
        />
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          className="flex size-11 items-center justify-center rounded-input text-muted-foreground hover:bg-surface-raised hover:text-danger"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="pl-10">
        <CardioStatFields
          fields={fields}
          values={set}
          distanceUnit={distanceUnit}
          labelPrefix={label}
          onValue={(field, value) =>
            onChange(
              field === "distance"
                ? { distance: value ?? undefined, distanceUnit: value === null ? undefined : distanceUnit }
                : { [field]: value ?? undefined }
            )
          }
        />
      </div>
    </li>
  );
}
