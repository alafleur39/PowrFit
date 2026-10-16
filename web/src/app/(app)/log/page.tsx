"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Plus } from "lucide-react";

import { ScreenHeader } from "@/components/shell/placeholder";
import { Button } from "@/components/ui/button";
import { useActiveWorkout } from "@/components/workout/active-workout-provider";
import { Dialog } from "@/components/workout/dialog";
import { ExerciseCard } from "@/components/workout/exercise-card";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { useNow } from "@/components/workout/use-now";
import { useRecentWorkouts } from "@/components/workout/use-workout-logs";
import {
  PRESET_ROUTINES,
  addExercise,
  addSet,
  draftSetCounts,
  draftTotals,
  lastSetsForExercise,
  removeExercise,
  removeSet,
  toggleSetDone,
  updateSet,
  type WorkoutDraft,
  type WorkoutLog,
} from "@/lib/strength";
import { formatElapsed, formatWeight } from "@/lib/workout/format";

// The live workout logger (design spec §6.5, Phase 2 P2-08 to P2-10).
export default function LogPage() {
  const { ready, draft, restoreProblem, storageProblem } = useActiveWorkout();

  if (!ready) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div>
      {restoreProblem && (
        <Notice>
          We couldn&apos;t restore a saved workout on this device. It was kept aside so it isn&apos;t
          lost.
        </Notice>
      )}
      {storageProblem && (
        <Notice>
          This device isn&apos;t saving your workout (storage is full or blocked). Don&apos;t close the
          app until you finish.
        </Notice>
      )}
      {draft ? <Logger draft={draft} /> : <StartPanel />}
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mx-4 mt-4 flex items-start gap-2 rounded-xl border border-danger/40 bg-surface p-3 text-sm sm:mx-6"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

function StartPanel() {
  const { start } = useActiveWorkout();

  return (
    <div>
      <ScreenHeader title="Start a workout" subtitle="Pick a preset or build one as you go." />
      <div className="flex flex-col gap-3 px-4 sm:px-6">
        {PRESET_ROUTINES.map((routine) => (
          <button
            key={routine.id}
            type="button"
            onClick={() => start(routine)}
            className="rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent/60"
          >
            <span className="block text-lg font-bold text-foreground">{routine.name}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {routine.exercises.length} exercises
              {routine.notes ? ` · ${routine.notes}` : ""}
            </span>
          </button>
        ))}
        <Button
          variant="outline"
          className="h-12 border-border bg-transparent text-base font-semibold text-foreground hover:bg-surface"
          onClick={() => start()}
        >
          <Plus className="size-4" aria-hidden />
          Start empty workout
        </Button>
      </div>
    </div>
  );
}

function useLastSets(draft: WorkoutDraft) {
  const { items } = useRecentWorkouts(50);
  return useMemo(() => {
    const logs: WorkoutLog[] = items.flatMap((item) =>
      "log" in item && item.log.id !== draft.id ? [item.log] : []
    );
    const result = new Map<string, WorkoutLog["exercises"][number]["sets"]>();
    for (const exercise of draft.exercises) {
      const last = lastSetsForExercise(logs, exercise.exerciseId);
      if (last) result.set(exercise.exerciseId, last.sets);
    }
    return result;
  }, [items, draft.id, draft.exercises]);
}

function Logger({ draft }: { draft: WorkoutDraft }) {
  const router = useRouter();
  const { update, discard, finish, unit } = useActiveWorkout();
  const now = useNow();
  const lastSets = useLastSets(draft);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const totals = draftTotals(draft, unit);
  const counts = draftSetCounts(draft);

  const confirmFinish = () => {
    const id = finish();
    setFinishOpen(false);
    router.push(`/workouts/history/${id}`);
  };

  return (
    <div className="pb-10">
      <header className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xl sm:px-6 md:top-0">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">{draft.routineName ?? "Workout"}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono tabular-nums text-accent">
              {formatElapsed(draft.startedAt, now)}
            </span>
            {" · "}
            {totals.sets} sets · {formatWeight(totals.volume, unit)}
          </p>
        </div>
        <Button className="h-11 px-5 text-base font-bold" onClick={() => setFinishOpen(true)}>
          Finish
        </Button>
      </header>

      <div className="flex flex-col gap-3 px-4 pt-4 sm:px-6">
        {draft.exercises.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            Add your first exercise to start logging sets.
          </p>
        )}

        {draft.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.key}
            exercise={exercise}
            unit={unit}
            lastSets={lastSets.get(exercise.exerciseId)}
            onChangeSet={(index, patch) =>
              update((current, time) => updateSet(current, exercise.key, index, patch, time))
            }
            onToggleSet={(index) =>
              update((current, time) => toggleSetDone(current, exercise.key, index, time))
            }
            onRemoveSet={(index) =>
              update((current, time) => removeSet(current, exercise.key, index, time))
            }
            onAddSet={() => update((current, time) => addSet(current, exercise.key, time))}
            onRemove={() => update((current, time) => removeExercise(current, exercise.key, time))}
          />
        ))}

        <Button
          variant="outline"
          className="h-12 border-border bg-transparent text-base font-semibold text-foreground hover:bg-surface"
          onClick={() => setPickerOpen(true)}
        >
          <Plus className="size-4" aria-hidden />
          Add exercise
        </Button>
        <button
          type="button"
          onClick={() => setDiscardOpen(true)}
          className="mx-auto mt-4 h-11 px-4 text-sm font-medium text-danger"
        >
          Discard workout
        </button>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={(ids) =>
          update((current, time) => ids.reduce((next, id) => addExercise(next, id, time), current))
        }
      />

      <Dialog
        open={finishOpen}
        title={counts.done > 0 ? "Finish workout?" : "Nothing to save yet"}
        onClose={() => setFinishOpen(false)}
        footer={
          <div className="flex flex-col gap-2">
            {counts.done > 0 && (
              <Button className="h-12 text-base font-bold" onClick={confirmFinish}>
                Finish and save
              </Button>
            )}
            <Button
              variant="ghost"
              className="h-12 text-base text-foreground hover:bg-surface hover:text-foreground"
              onClick={() => setFinishOpen(false)}
            >
              Keep logging
            </Button>
          </div>
        }
      >
        {counts.done > 0 ? (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              {counts.done} {counts.done === 1 ? "set" : "sets"} done ·{" "}
              {formatWeight(totals.volume, unit)} volume.
            </p>
            {counts.notDone > 0 && (
              <p className="text-muted-foreground">
                {counts.notDone} unticked {counts.notDone === 1 ? "set" : "sets"} will be
                discarded. Only ticked sets are saved.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tick at least one set to finish. To throw this workout away, use Discard workout.
          </p>
        )}
      </Dialog>

      <Dialog
        open={discardOpen}
        title="Discard this workout?"
        onClose={() => setDiscardOpen(false)}
        footer={
          <div className="flex flex-col gap-2">
            <Button
              variant="destructive"
              className="h-12 text-base font-bold"
              onClick={() => {
                discard();
                setDiscardOpen(false);
              }}
            >
              Discard workout
            </Button>
            <Button
              variant="ghost"
              className="h-12 text-base text-foreground hover:bg-surface hover:text-foreground"
              onClick={() => setDiscardOpen(false)}
            >
              Keep logging
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Every set in this workout will be deleted. This can&apos;t be undone.
        </p>
      </Dialog>
    </div>
  );
}
