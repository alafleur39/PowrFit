"use client";

import { useState } from "react";
import { ArrowLeft, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  cleanEditedLog,
  editLogSet,
  logProblems,
  removeLogExercise,
  removeLogSet,
  type WorkoutLog,
} from "@/lib/strength";
import { formatDate, parseRepsInput, parseWeightInput } from "@/lib/workout/format";
import { useActiveWorkout } from "./active-workout-provider";
import { Dialog } from "./dialog";
import { NumberField } from "./set-row";

const nowIso = () => new Date().toISOString();

// Editing a past workout (P4-05, D24). Shown in place of the summary rather
// than on its own route, because a route the device hasn't loaded can't open
// offline. Edits a local copy; nothing is written until Save. Saving goes through the same receipts as finishing a workout,
// so it works offline and shows "Not synced yet" until it's confirmed.
// Weights are edited in the unit each set was logged in. A cleared field is
// NaN until it's filled in again; logProblems blocks saving it.
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
        className="inline-flex h-11 items-center gap-2 px-4 text-sm font-medium text-muted-foreground hover:text-foreground sm:px-6"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Cancel
      </button>

      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 sm:px-6">
        <header>
          <p className="text-sm text-muted-foreground">{formatDate(log.endedAt)}</p>
          <h1 className="mt-1 text-2xl font-bold">Edit workout</h1>
        </header>

        <ol className="flex flex-col gap-3" aria-label="Exercises">
          {log.exercises.map((exercise, exerciseIndex) => {
            const name = exercise.exerciseName;
            return (
              <li
                key={`${exercise.exerciseId}-${exerciseIndex}`}
                className="rounded-2xl border border-border bg-surface p-3"
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
                  <p className="mt-2 text-sm text-muted-foreground">
                    No sets left. This exercise will be removed when you save.
                  </p>
                ) : (
                  <ol className="mt-2 flex flex-col gap-2">
                    {exercise.sets.map((set, setIndex) => {
                      const number = setIndex + 1;
                      return (
                        <li
                          key={setIndex}
                          className="grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-2"
                        >
                          <span className="text-center font-mono text-sm text-muted-foreground" aria-hidden>
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
                            className="flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-raised hover:text-danger"
                          >
                            <X className="size-4" aria-hidden />
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>

        {problems.length > 0 && (
          <ul role="alert" className="rounded-xl border border-danger/40 bg-surface p-3 text-sm text-danger">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-3">
          <Button className="h-12 flex-1 text-base font-bold" onClick={save}>
            Save changes
          </Button>
          <Button
            variant="outline"
            className="h-12 border-danger/50 bg-transparent text-base font-semibold text-danger hover:bg-surface"
            onClick={() => setDeleteOpen(true)}
          >
            Delete workout
          </Button>
        </div>
      </div>

      <Dialog
        open={deleteOpen}
        title="Delete this workout?"
        onClose={() => setDeleteOpen(false)}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 flex-1" onClick={() => setDeleteOpen(false)}>
              Keep it
            </Button>
            <Button className="h-12 flex-1 bg-danger text-white hover:bg-danger/90" onClick={remove}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          It will be removed from History, your stats and your personal records on every device.
          This can&apos;t be undone.
        </p>
      </Dialog>
    </div>
  );
}
