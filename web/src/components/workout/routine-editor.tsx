"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  EXERCISES,
  ROUTINE_LIMITS,
  addRoutineExercise,
  cleanRoutine,
  moveRoutineExercise,
  removeRoutineExercise,
  routineProblems,
  updateRoutineDetails,
  updateRoutineExercise,
  type Routine,
} from "@/lib/strength";
import { deleteRoutine, saveRoutine } from "@/lib/workout/routine-repo";
import { Dialog } from "./dialog";
import { ExercisePicker } from "./exercise-picker";

const EXERCISE_NAMES = new Map(EXERCISES.map((exercise) => [exercise.id, exercise.name]));
const SET_OPTIONS = Array.from({ length: ROUTINE_LIMITS.targetSets }, (_, i) => i + 1);
const REST_OPTIONS = [30, 45, 60, 90, 120, 150, 180, 240, 300];

const field =
  "w-full rounded-lg border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none";
const iconButton =
  "flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-raised hover:text-foreground disabled:opacity-30";

const nowIso = () => new Date().toISOString();

/** "45 s", "2 min", "1 min 30 s". */
function restLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} s`;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

// Routine editor (P4-02, D21). Edits a local copy; nothing is written until
// Save. Saving isn't awaited: offline, the write waits in Firestore's cache
// and the routine shows as "Not synced yet" until it's confirmed.
export function RoutineEditor({ initial, isNew }: { initial: Routine; isNew: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const [routine, setRoutine] = useState(initial);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);

  const change = (next: (current: Routine, now: string) => Routine) =>
    setRoutine((current) => next(current, nowIso()));

  const save = () => {
    const found = routineProblems(routine);
    setProblems(found);
    if (found.length > 0 || !user) return;
    saveRoutine(user.uid, cleanRoutine(routine)).catch((error: unknown) =>
      console.error("Saving the routine failed", error)
    );
    router.push("/workouts");
  };

  const remove = () => {
    if (!user) return;
    deleteRoutine(user.uid, routine.id).catch((error: unknown) =>
      console.error("Deleting the routine failed", error)
    );
    router.push("/workouts");
  };

  return (
    <div className="pb-10">
      <Link
        href="/workouts"
        className="inline-flex h-11 items-center gap-2 px-4 text-sm font-medium text-muted-foreground hover:text-foreground sm:px-6"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Workouts
      </Link>

      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 sm:px-6">
        <h1 className="text-2xl font-bold">{isNew ? "New routine" : "Edit routine"}</h1>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Routine name</span>
          <input
            value={routine.name}
            maxLength={ROUTINE_LIMITS.name}
            onChange={(event) => change((r, now) => updateRoutineDetails(r, { name: event.target.value }, now))}
            placeholder="Upper body A"
            className={`${field} h-11`}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Notes (optional)</span>
          <textarea
            value={routine.notes ?? ""}
            maxLength={ROUTINE_LIMITS.notes}
            rows={2}
            onChange={(event) => change((r, now) => updateRoutineDetails(r, { notes: event.target.value }, now))}
            className={`${field} py-2`}
          />
        </label>

        <ol className="flex flex-col gap-3" aria-label="Exercises">
          {routine.exercises.map((exercise, index) => {
            const name = EXERCISE_NAMES.get(exercise.exerciseId) ?? exercise.exerciseId;
            return (
              <li
                key={`${exercise.exerciseId}-${index}`}
                className="rounded-2xl border border-border bg-surface p-3"
              >
                <div className="flex items-center gap-1">
                  <h2 className="min-w-0 flex-1 truncate font-bold">{name}</h2>
                  <button
                    type="button"
                    aria-label={`Move ${name} up`}
                    disabled={index === 0}
                    onClick={() => change((r, now) => moveRoutineExercise(r, index, index - 1, now))}
                    className={iconButton}
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${name} down`}
                    disabled={index === routine.exercises.length - 1}
                    onClick={() => change((r, now) => moveRoutineExercise(r, index, index + 1, now))}
                    className={iconButton}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    onClick={() => change((r, now) => removeRoutineExercise(r, index, now))}
                    className={iconButton}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Sets</span>
                    <select
                      aria-label={`Sets for ${name}`}
                      value={exercise.targetSets}
                      onChange={(event) =>
                        change((r, now) =>
                          updateRoutineExercise(r, index, { targetSets: Number(event.target.value) }, now)
                        )
                      }
                      className={`${field} h-11`}
                    >
                      {SET_OPTIONS.map((count) => (
                        <option key={count} value={count}>
                          {count}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Reps</span>
                    <input
                      aria-label={`Reps for ${name}`}
                      value={exercise.targetReps ?? ""}
                      maxLength={ROUTINE_LIMITS.targetReps}
                      placeholder="8–12"
                      onChange={(event) =>
                        change((r, now) =>
                          updateRoutineExercise(r, index, { targetReps: event.target.value }, now)
                        )
                      }
                      className={`${field} h-11`}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Rest</span>
                    <select
                      aria-label={`Rest for ${name}`}
                      value={exercise.restSec ?? ""}
                      onChange={(event) =>
                        change((r, now) =>
                          updateRoutineExercise(
                            r,
                            index,
                            { restSec: event.target.value === "" ? null : Number(event.target.value) },
                            now
                          )
                        )
                      }
                      className={`${field} h-11`}
                    >
                      <option value="">Default</option>
                      {REST_OPTIONS.map((seconds) => (
                        <option key={seconds} value={seconds}>
                          {restLabel(seconds)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </li>
            );
          })}
        </ol>

        <Button
          variant="outline"
          disabled={routine.exercises.length >= ROUTINE_LIMITS.exercises}
          className="h-12 border-dashed border-border bg-transparent text-base font-semibold text-foreground hover:bg-surface"
          onClick={() => setPickerOpen(true)}
        >
          <Plus className="size-4" aria-hidden />
          Add exercises
        </Button>

        {problems.length > 0 && (
          <ul role="alert" className="rounded-xl border border-danger/40 bg-surface p-3 text-sm text-danger">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-3">
          <Button className="h-12 flex-1 text-base font-bold" onClick={save}>
            Save routine
          </Button>
          {!isNew && (
            <Button
              variant="outline"
              className="h-12 border-danger/50 bg-transparent text-base font-semibold text-danger hover:bg-surface"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={(ids) =>
          change((r, now) =>
            ids
              .slice(0, ROUTINE_LIMITS.exercises - r.exercises.length)
              .reduce((next, id) => addRoutineExercise(next, id, now), r)
          )
        }
      />

      <Dialog
        open={deleteOpen}
        title="Delete this routine?"
        onClose={() => setDeleteOpen(false)}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 flex-1" onClick={() => setDeleteOpen(false)}>
              Keep it
            </Button>
            <Button className="h-12 flex-1 bg-danger text-white hover:bg-danger/90" onClick={remove}>
              Delete routine
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          {routine.name || "This routine"} will be removed from My routines. Workouts you already
          logged with it stay in History.
        </p>
      </Dialog>
    </div>
  );
}
